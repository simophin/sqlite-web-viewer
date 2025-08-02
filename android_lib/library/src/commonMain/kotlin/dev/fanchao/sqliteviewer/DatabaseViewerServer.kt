

package dev.fanchao.sqliteviewer

import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.Request
import io.ktor.http.ContentType
import io.ktor.http.defaultForFilePath
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.embeddedServer
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.path
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondSource
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.launch
import kotlinx.io.RawSource

/**
 * Launches the Ktor server in a new Job, returns Pair<Job, Deferred<Int>>.
 * Job is the server handle (cancel to stop), Deferred<Int> completes with the bound port.
 */
fun startDatabaseViewerServer(
    port: Int,
    queryable: Queryable,
    assetProvider: StaticAssetProvider? = null
): Pair<Job, Deferred<Int>> {
    val portDeferred = CompletableDeferred<Int>()
    val job = GlobalScope.launch(Dispatchers.Default) {
        val server = embeddedServer(
            factory = CIO,
            port = port,
        ) {
            configureDatabaseViewerRouting(queryable, assetProvider)
        }
        server.start(wait = false)
        portDeferred.complete(server.environment.connectors.first().port)
        try {
            // Wait until cancelled
            this@launch.join()
        } finally {
            server.stop(1000, 2000)
        }
    }
    return job to portDeferred
}




interface StaticAssetProvider {
    /**
     * Returns an InputStream for the given asset path, or null if not found.
     * The path always starts with a slash, e.g. "/index.html".
     */
    fun openAsset(path: String): RawSource?
}

fun Application.configureDatabaseViewerRouting(queryable: Queryable, assetProvider: StaticAssetProvider? = null) {
    install(ContentNegotiation) { json() }
    routing {
        post("/query") {
            val req = call.receive<Request>()
            val dbVersion = queryable.dbVersion
            val results = queryable.runInTransaction(req.queries
                .asSequence()
                .map { it.getQuery(dbVersion) }
            )
            call.respond(results)
        }
        if (assetProvider != null) {
            get("{...}") {
                val path = call.request.path().let {
                    if (it == "/") "/index.html" else it
                }
                val contentType = ContentType.defaultForFilePath(path)
                val inStream = assetProvider.openAsset(path)
                if (inStream != null) {
                    call.respondSource(inStream, contentType)
                } else {
                    call.respond(io.ktor.http.HttpStatusCode.NotFound)
                }
            }
        }
    }
}

