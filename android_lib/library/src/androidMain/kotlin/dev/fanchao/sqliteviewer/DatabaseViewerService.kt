package dev.fanchao.sqliteviewer

import android.app.NotificationManager.IMPORTANCE_HIGH
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

internal typealias BroadcastAction = String

internal class DatabaseViewerService : Service() {
    private val startedPorts = mutableSetOf<Int>()

    private fun syncNotification() {
        if (startedPorts.isEmpty()) {
            return
        }

        val channel = NotificationChannelCompat.Builder("service_viewer", IMPORTANCE_HIGH)
            .setName("Database Viewer Service")
            .setDescription("Service for viewing SQLite databases")
            .build()

        NotificationManagerCompat.from(this).createNotificationChannel(channel)

        for (port in startedPorts) {
            startForeground(port, NotificationCompat.Builder(this, channel.id)
                .setContentTitle("Server running")
                .setContentText("Listening on port $port")
                // Set small icon to the package's launcher icon
                .setSmallIcon(R.drawable.outline_architecture)
                .addAction(R.drawable.ic_stop, "Stop", PendingIntent.getBroadcast(
                    this,
                    0,
                    Intent("${STOP_BROADCAST_ACTION_PREFIX}$port").apply {
                        `package` = this@DatabaseViewerService.packageName
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                ))
                .build())
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
        val port = requireNotNull(intent.getIntExtra(ARG_PORT, -1).takeIf { it > 0 }) {
            "Port must be specified in the intent"
        }

        when (intent.action) {
            COMMAND_ACTION_START -> {
                if (startedPorts.add(port)) {
                    syncNotification()
                }
            }

            COMMAND_ACTION_STOP -> {
                startedPorts -= port

                NotificationManagerCompat.from(this)
                    .cancel(port)

                if (startedPorts.isEmpty()) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    companion object {
        private const val COMMAND_ACTION_START = "start"
        private const val ARG_PORT = "port"

        private const val COMMAND_ACTION_STOP = "stop"

        fun createStartIntent(context: Context, port: Int): Pair<Intent, BroadcastAction> {
            return Intent(context, DatabaseViewerService::class.java).apply {
                action = COMMAND_ACTION_START
                putExtra(ARG_PORT, port)
            } to "${STOP_BROADCAST_ACTION_PREFIX}$port"
        }

        fun createStopIntent(context: Context, port: Int): Intent {
            return Intent(context, DatabaseViewerService::class.java).apply {
                action = COMMAND_ACTION_STOP
                putExtra(ARG_PORT, port)
            }
        }

        private const val STOP_BROADCAST_ACTION_PREFIX = "dev.fanchao.sqliteviewer.STOP_"
    }
}
