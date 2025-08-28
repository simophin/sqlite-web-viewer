package dev.fanchao.sqliteviewer

import dev.fanchao.sqliteviewer.model.QueryResults
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.Request
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.defaultForFilePath
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.request.path
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondSource
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
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

/**
 * Launches the Ktor server in a new Job, returns Pair<Job, Deferred<Int>>.
 * Job is the server handle (cancel to stop), Deferred<Int> completes with the bound port.
 */
fun startDatabaseViewerServerShared(
    port: Int,
    queryable: Queryable,
    assetProvider: StaticAssetProvider,
): StartedInstance {
    val server = embeddedServer(
        factory = CIO,
        port = port,
    ) {
        configureDatabaseViewerRouting(queryable, assetProvider)
    }

    return StartedInstance(server)
}

private fun Application.configureDatabaseViewerRouting(
    queryable: Queryable,
    assetProvider: StaticAssetProvider
) {
    install(ContentNegotiation) { json() }
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.AccessControlAllowOrigin)
        allowHeader(HttpHeaders.AccessControlAllowHeaders)
        anyMethod()
        allowCredentials = true
    }
    routing {
        post("/query") {
            val req = call.receive<Request>()
            val results = runCatching {
                queryable.runInTransaction(req.queries.asSequence())
            }.getOrElse { err ->
                QueryResults.Error(
                    message = err.message.orEmpty(),
                    diagnostic = err.stackTraceToString(),
                )
            }
            call.respond(results)
        }

        get("{...}") {
            val path = call.request.path().let {
                if (it == "/" || !it.startsWith("/")) "/index.html" else it
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

