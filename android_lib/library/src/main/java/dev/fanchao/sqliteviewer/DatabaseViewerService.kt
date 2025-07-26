package dev.fanchao.sqliteviewer

import android.app.NotificationManager.IMPORTANCE_HIGH
import android.app.NotificationManager.IMPORTANCE_LOW
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.sqlite.db.SupportSQLiteDatabase
import dev.fanchao.sqliteviewer.model.QueryResult
import dev.fanchao.sqliteviewer.model.QueryResults
import dev.fanchao.sqliteviewer.model.Request
import io.ktor.http.ContentType
import io.ktor.http.defaultForFilePath
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.cio.CIOApplicationEngine
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.path
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondNullable
import io.ktor.server.response.respondOutputStream
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

abstract class DatabaseViewerService : Service() {
    private var job: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
        when (intent.action) {
            COMMAND_ACTION_START -> {
                job = GlobalScope.launch {
                    val db by lazy { openDatabase() }
                    val server = embeddedServer(factory = CIO, port = 3000) {
                        install(ContentNegotiation) {
                            json()
                        }

                        routing {
                            post("/query") {
                                val req = call.receive<Request>()

                                val results = ArrayList<QueryResult>(req.queries.size)

                                val start = SystemClock.elapsedRealtime()
                                db.beginTransaction()
                                try {
                                    for (query in req.queries) {
                                        db.query(query.sql, query.params.toTypedArray())
                                            .use { cursor ->
                                                results.add(QueryResult.fromCursor(0, cursor))
                                            }
                                    }
                                    db.setTransactionSuccessful()
                                } finally {
                                    db.endTransaction()
                                }

                                call.respond(QueryResults(
                                    executionTimeUs = (SystemClock.elapsedRealtime() - start) * 1000L,
                                    results = results
                                ))
                            }

                            get("{...}") {
                                val path = call.request.path().let {
                                    if (it == "/") "/index.html" else it
                                }

                                Log.d("DatabaseViewerService", "Serving static file: $path")
                                val contentType = ContentType.defaultForFilePath(path)
                                assets.open("webapp$path").use { inStream ->
                                    call.respondOutputStream(contentType) {
                                        inStream.copyTo(this)
                                    }
                                }
                            }
                        }
                    }

                    launch {
                        val port = server.engine.resolvedConnectors().first().port

                        val channel = NotificationChannelCompat.Builder("service_viewer", IMPORTANCE_HIGH)
                            .setName("Database Viewer Service")
                            .setDescription("Service for viewing SQLite databases")
                            .build()

                        val context = this@DatabaseViewerService
                        NotificationManagerCompat.from(context).createNotificationChannel(channel)

                        startForeground(1, NotificationCompat.Builder(context, channel.id)
                            .setContentTitle("Server running")
                            .setContentText("Listening on port $port")
                            // Set small icon to the package's launcher icon
                            .setSmallIcon(R.drawable.outline_architecture)
                            .addAction(R.drawable.ic_stop, "Stop", PendingIntent.getService(
                                context,
                                0,
                                Intent(context, context.javaClass).apply {
                                    action = COMMAND_ACTION_STOP
                                },
                                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                            ))
                            .build())
                    }

                    server.startSuspend(wait = true)
                }
            }

            COMMAND_ACTION_STOP -> {
                job?.cancel()
                job = null

                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    abstract fun openDatabase(): SupportSQLiteDatabase

    companion object {
        const val COMMAND_ACTION_START = "start"
        const val COMMAND_ACTION_STOP = "stop"

        inline fun <reified S: DatabaseViewerService> createIntent(context: Context, action: String): Intent {
            return Intent(context, S::class.java).apply {
                this.action = action
            }
        }
    }
}