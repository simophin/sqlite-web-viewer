// ...existing code from main/java/dev/fanchao/sqliteviewer/DatabaseViewerServer.kt...
package dev.fanchao.sqliteviewer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.Request
import io.ktor.http.ContentType
import io.ktor.http.defaultForFilePath
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.embeddedServer
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.path
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondOutputStream
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

actual fun startDatabaseViewerServer(
    port: Int,
    queryable: Queryable,
): Any = throw NotImplementedError("Use the Android-specific overload with context and scope")


import io.ktor.http.ContentType
import io.ktor.http.defaultForFilePath
import io.ktor.server.application.Application
import io.ktor.server.cio.CIO
import io.ktor.server.engine.embeddedServer
import io.ktor.server.request.path
import io.ktor.server.response.respondOutputStream
import io.ktor.server.routing.get

class AndroidAssetProvider(private val context: Context) : StaticAssetProvider {
    override fun openAsset(path: String): java.io.InputStream? =
        try {
            context.assets.open("webapp$path")
        } catch (e: Exception) {
            null
        }
}

fun startDatabaseViewerServer(
    scope: CoroutineScope,
    context: Context,
    port: Int,
    queryable: Queryable,
): Job {
    return scope.launch {
        val actualPort = startDatabaseViewerServerShared(
            scope = this,
            port = port,
            queryable = queryable,
            assetProvider = AndroidAssetProvider(context)
        )

        val (intent, broadcastAction) = DatabaseViewerService.createStartIntent(context, actualPort)
        context.startService(intent)

        try {
            waitForBroadcast(context, broadcastAction)
        } finally {
            context.startService(DatabaseViewerService.createStopIntent(context, actualPort))
        }
    }
}

private suspend fun waitForBroadcast(
    context: Context,
    broadcastAction: String,
): Intent {
    return suspendCancellableCoroutine { continuation ->
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action == broadcastAction) {
                    context.unregisterReceiver(this)
                    continuation.resume(intent)
                }
            }
        }

        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(receiver, IntentFilter(broadcastAction), Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, IntentFilter(broadcastAction))
        }

        continuation.invokeOnCancellation {
            context.unregisterReceiver(receiver)
        }
    }
}
