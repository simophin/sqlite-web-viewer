package dev.fanchao.sqliteviewer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import dev.fanchao.sqliteviewer.model.Queryable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.lang.ref.WeakReference
import kotlin.coroutines.resume

actual fun startDatabaseViewerServer(
    platformContext: Any,
    scope: CoroutineScope,
    port: Int,
    queryable: Queryable,
): Job {
    val context = platformContext as Context
    val contextRef = WeakReference(context)
    val applicationContext = context.applicationContext

    return scope.launch {
        val portChannel = Channel<Int>()

        val job = launch {
            startDatabaseViewerServerShared(
                port = port,
                queryable = queryable,
                assetProvider = AndroidAssetProvider(applicationContext),
                portListened = portChannel,
            )
        }

        val actualPort = portChannel.receive()

        val (intent, broadcastAction) = DatabaseViewerService.createStartIntent(applicationContext, actualPort)
        contextRef.get()?.startService(intent)

        try {
            waitForBroadcast(applicationContext, broadcastAction)
        } finally {
            applicationContext.startService(DatabaseViewerService.createStopIntent(applicationContext, actualPort))
            job.cancel()
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