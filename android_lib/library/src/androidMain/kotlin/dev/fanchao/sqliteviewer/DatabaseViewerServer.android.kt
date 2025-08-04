package dev.fanchao.sqliteviewer

import android.Manifest
import android.app.Activity
import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import dev.fanchao.sqliteviewer.model.Queryable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.lang.ref.WeakReference
import kotlin.coroutines.resume

actual fun startDatabaseViewerServer(
    platformContext: Any,
    scope: CoroutineScope,
    port: Int,
    queryable: Queryable,
): Job? {
    val context = requireNotNull(platformContext as? ComponentActivity) {
        "Platform context must be an Activity for Android implementation"
    }

    if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        context.startActivity(Intent(context, PermissionRequestActivity::class.java))
        return null
    }

    val contextRef = WeakReference(context)
    val applicationContext = context.applicationContext

    return scope.launch {
        val (job, actualPort) = startDatabaseViewerServerShared(
            port = port,
            queryable = queryable,
            assetProvider = AndroidAssetProvider(applicationContext),
        )

        val (intent, broadcastAction) = DatabaseViewerService.createStartIntent(applicationContext, port)
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