package dev.fanchao.sqliteviewer

import dev.fanchao.sqliteviewer.model.QueryResults
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.QueryableFactory
import dev.fanchao.sqliteviewer.model.Request
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.defaultForFilePath
import io.ktor.http.encodeURLPathPart
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.request.path
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.response.respondRedirect
import io.ktor.server.response.respondSource
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import io.ktor.util.escapeHTML
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlin.concurrent.atomics.AtomicBoolean
import kotlin.concurrent.atomics.ExperimentalAtomicApi

@OptIn(ExperimentalAtomicApi::class, DelicateCoroutinesApi::class)
class StartedInstance(
    private val server: EmbeddedServer<*, *>
) {
    sealed interface State {
        data object Starting : State
        data class Running(val port: Int) : State
        data class Stopped(val port: Int?) : State
    }

    private val stopRequested = AtomicBoolean(false)

    val state: StateFlow<State> = flow {
        var port: Int? = null
        try {
            coroutineScope {
                val startJob = launch {
                    server.startSuspend(wait = true)
                }

                port = server.engine.resolvedConnectors().first().port
                emit(State.Running(port))
                startJob.join() // Wait for the server to finish starting
            }
        } catch (e: Throwable) {
            if (e is CancellationException) throw e
        } finally {
            emit(State.Stopped(port))
        }
    }.stateIn(GlobalScope, started = SharingStarted.Eagerly, initialValue = State.Starting)

    fun stop() {
        if (stopRequested.compareAndSet(expectedValue = false, newValue = true)) {
            GlobalScope.launch {
                server.stopSuspend()
            }
        }
    }
}

private val viewerJson = Json { encodeDefaults = true }

/**
 * Mounts a single-database viewer at the current route path.
 *
 * This is the composable primitive: a host application can mount it anywhere
 * (under an auth block, a path prefix, etc.) since it only registers routes and
 * does not install application-wide plugins. Request/response bodies are
 * (de)serialized directly so it never conflicts with a host's ContentNegotiation.
 *
 * The viewer's static bundle uses URLs relative to the document, so the mount
 * root must be served with a trailing slash; requests without one are redirected.
 */
fun Route.databaseViewer(
    queryable: Queryable,
    assetProvider: StaticAssetProvider,
) {
    post("query") {
        call.respondQuery(queryable)
    }

    get("{path...}") {
        call.respondAsset(assetProvider, call.parameters.getAll("path").orEmpty())
    }
}

/** Runs [queryable] over the request's queries and writes the JSON results. */
private suspend fun ApplicationCall.respondQuery(queryable: Queryable) {
    val req = viewerJson.decodeFromString(Request.serializer(), receiveText())
    val results = runCatching {
        queryable.runInTransaction(req.queries.asSequence())
    }.getOrElse { err ->
        QueryResults.Error(
            message = err.message.orEmpty(),
            diagnostic = err.stackTraceToString(),
        )
    }
    respondText(
        viewerJson.encodeToString(QueryResults.serializer(), results),
        ContentType.Application.Json,
    )
}

/** Serves a static asset for the viewer mounted at the current path. */
private suspend fun ApplicationCall.respondAsset(
    assetProvider: StaticAssetProvider,
    segments: List<String>,
) {
    // Ensure the mount root carries a trailing slash so the SPA's relative
    // asset/query URLs resolve under this prefix rather than its parent.
    if (segments.isEmpty() && !request.path().endsWith("/")) {
        respondRedirect(request.path() + "/")
        return
    }

    val assetPath = "/" + segments.joinToString("/").ifEmpty { "index.html" }
    val contentType = ContentType.defaultForFilePath(assetPath)
    val inStream = assetProvider.openAsset(assetPath)
    if (inStream != null) {
        respondSource(inStream, contentType)
    } else {
        respond(HttpStatusCode.NotFound)
    }
}

/**
 * Mounts an index of the databases supplied by [factory] at the current route
 * path and a full viewer for each one under its id (e.g. mounting this under
 * `/__db` exposes `/__db/`, `/__db/orders/`, `/__db/users/`). Selecting a
 * database on the index navigates to that database's own viewer.
 *
 * Unlike a fixed map, [factory] is consulted on every request, so the available
 * databases can change at runtime: ids missing from [QueryableFactory.databaseIds]
 * drop off the index and any request resolving to a null [Queryable] returns 404.
 */
fun Route.databaseViewers(
    factory: QueryableFactory,
    assetProvider: StaticAssetProvider,
) {
    // A single dynamic id segment dispatches to whichever queryable the factory
    // resolves now. Ktor scores this parameter route above the bare index
    // wildcard below, so the index only handles the group root.
    route("{dbId}") {
        post("query") {
            val queryable = factory.queryableFor(call.parameters["dbId"]!!)
            if (queryable == null) {
                call.respond(HttpStatusCode.NotFound)
                return@post
            }
            call.respondQuery(queryable)
        }

        get("{path...}") {
            if (factory.queryableFor(call.parameters["dbId"]!!) == null) {
                call.respond(HttpStatusCode.NotFound)
                return@get
            }
            call.respondAsset(assetProvider, call.parameters.getAll("path").orEmpty())
        }
    }

    // Index. Links are built from the live request path so they work whether or
    // not the index URL carries a trailing slash.
    get("{path...}") {
        val base = call.request.path().let { if (it.endsWith("/")) it else "$it/" }
        call.respondText(renderIndex(factory.databaseIds(), base), ContentType.Text.Html)
    }
}

/**
 * Convenience overload mounting a fixed [databases] map; equivalent to passing
 * `QueryableFactory(databases)`.
 */
fun Route.databaseViewers(
    databases: Map<String, Queryable>,
    assetProvider: StaticAssetProvider,
) = databaseViewers(QueryableFactory(databases), assetProvider)

private fun renderIndex(ids: Collection<String>, base: String): String {
    // Pico CSS gives the page sensible classless styling (typography, spacing,
    // dark/light) without any custom rules to maintain.
    val body = if (ids.isEmpty()) {
        "<p>No databases are currently available.</p>"
    } else {
        val items = ids.joinToString("\n") { id ->
            // The id is a single URL path segment, so percent-encode it (this
            // encodes '/', '?', '#', spaces, etc. that would otherwise break the
            // link); use the HTML-escaped form only for the visible link text.
            val href = id.encodeURLPathPart()
            val text = id.escapeHTML()
            """<li><a target="_blank" href="$base$href/">$text</a></li>"""
        }
        """
        <ul>
        $items
        </ul>
        """.trimIndent()
    }
    return """
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="color-scheme" content="dark light" />
            <title>SQLite Viewer — Databases</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
        </head>
        <body>
            <main class="container">
                <hgroup>
                    <h1>SQLite Viewer</h1>
                    <p>Select a database to browse.</p>
                </hgroup>
                $body
            </main>
        </body>
        </html>
    """.trimIndent()
}

/**
 * Launches an embedded server serving a single database at the root path.
 */
fun startDatabaseViewerServerShared(
    port: Int,
    queryable: Queryable,
    assetProvider: StaticAssetProvider,
): StartedInstance {
    val server = embeddedServer(factory = CIO, port = port) {
        configureDevPlugins()
        routing { databaseViewer(queryable, assetProvider) }
    }
    return StartedInstance(server)
}

/**
 * Launches an embedded server serving the databases supplied by [factory]. An
 * index is served at the root path and each database is exposed under its id
 * (e.g. `/orders/`). The factory is consulted per request, so the set of
 * databases may change while the server runs.
 */
fun startDatabaseViewerServerShared(
    port: Int,
    factory: QueryableFactory,
    assetProvider: StaticAssetProvider,
): StartedInstance {
    val server = embeddedServer(factory = CIO, port = port) {
        configureDevPlugins()
        routing { databaseViewers(factory, assetProvider) }
    }
    return StartedInstance(server)
}

/**
 * Launches an embedded server serving a fixed [databases] map. An index is served
 * at the root path and each database is exposed under its id (e.g. `/orders/`).
 */
fun startDatabaseViewerServerShared(
    port: Int,
    databases: Map<String, Queryable>,
    assetProvider: StaticAssetProvider,
): StartedInstance = startDatabaseViewerServerShared(port, QueryableFactory(databases), assetProvider)

private fun Application.configureDevPlugins() {
    // Permit the Vite dev server (a different origin) to reach the API during
    // development. In production the bundle is served same-origin, so CORS is moot.
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.AccessControlAllowOrigin)
        allowHeader(HttpHeaders.AccessControlAllowHeaders)
        anyMethod()
        allowCredentials = true
    }
}
