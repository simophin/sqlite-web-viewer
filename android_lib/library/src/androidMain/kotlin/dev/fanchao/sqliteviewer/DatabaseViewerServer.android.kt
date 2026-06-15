package dev.fanchao.sqliteviewer

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.QueryableFactory
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.flow.takeWhile
import kotlinx.coroutines.flow.transformWhile
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.lang.ref.WeakReference
import kotlin.coroutines.resume

fun startDatabaseViewerServer(
    context: Activity,
    port: Int,
    queryable: Queryable,
): StartedInstance = startDatabaseViewerServer(context, port) { applicationContext ->
    startDatabaseViewerServerShared(
        port = port,
        queryable = queryable,
        assetProvider = AndroidAssetProvider(applicationContext),
    )
}

/**
 * Serves the databases supplied by [factory], each under its id, with an index at
 * the root. The factory is consulted per request, so the available databases can
 * change while the server runs.
 */
fun startDatabaseViewerServer(
    context: Activity,
    port: Int,
    factory: QueryableFactory,
): StartedInstance = startDatabaseViewerServer(context, port) { applicationContext ->
    startDatabaseViewerServerShared(
        port = port,
        factory = factory,
        assetProvider = AndroidAssetProvider(applicationContext),
    )
}

private inline fun startDatabaseViewerServer(
    context: Activity,
    port: Int,
    start: (applicationContext: Context) -> StartedInstance,
): StartedInstance {
    val contextRef = WeakReference(context)
    val applicationContext = context.applicationContext

    val instance = start(applicationContext)

    GlobalScope.launch {
        instance.state
            .transformWhile { state ->
                emit(state)
                state !is StartedInstance.State.Stopped
            }
            .collect { state ->
                when (state) {
                    StartedInstance.State.Starting -> {}

                    is StartedInstance.State.Running -> {
                        val (intent, broadcastAction) = DatabaseViewerService.createStartIntent(applicationContext, port)
                        contextRef.get()?.startService(intent)

                        launch {
                            waitForBroadcast(applicationContext, broadcastAction)
                            instance.stop()
                        }
                    }

                    is StartedInstance.State.Stopped -> {
                        if (state.port != null) {
                            applicationContext.startService(
                                DatabaseViewerService.createStopIntent(
                                    context = applicationContext,
                                    port = state.port
                                )
                            )
                        }
                    }
                }
            }
    }

    return instance
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