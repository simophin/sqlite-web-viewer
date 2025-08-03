

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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

expect fun startDatabaseViewerServer(
    platformContext: Any,
    scope: CoroutineScope,
    port: Int,
    queryable: Queryable,
): Job

/**
 * Launches the Ktor server in a new Job, returns Pair<Job, Deferred<Int>>.
 * Job is the server handle (cancel to stop), Deferred<Int> completes with the bound port.
 */
suspend fun startDatabaseViewerServerShared(
    port: Int,
    queryable: Queryable,
    assetProvider: StaticAssetProvider,
): Pair<Job, Int> {
    val server = embeddedServer(
        factory = CIO,
        port = port,
    ) {
        configureDatabaseViewerRouting(queryable, assetProvider)
    }

    val job = GlobalScope.launch {
        runCatching {  server.startSuspend(wait = true) }
        server.stop(1000, 1000)
    }

    val port = server.engine.resolvedConnectors().first().port
    return job to port
}

private fun Application.configureDatabaseViewerRouting(queryable: Queryable, assetProvider: StaticAssetProvider) {
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

