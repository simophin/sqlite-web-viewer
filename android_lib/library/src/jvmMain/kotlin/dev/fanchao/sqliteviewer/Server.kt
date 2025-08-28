package dev.fanchao.sqliteviewer

import androidx.sqlite.SQLiteConnection
import androidx.sqlite.driver.bundled.BundledSQLiteDriver
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.filterIsInstance
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.io.RawSource

class EmptyStaticAssetProvider : StaticAssetProvider {
    override fun openAsset(path: String): RawSource? {
        return null
    }
}

fun main() = runBlocking {
    val driver = BundledSQLiteDriver()

    val connString = System.getenv("DB_PATH")
        ?.takeIf { it.isNotBlank() }
        ?: ":memory:"

    val connStorage = ThreadLocal<SQLiteConnection>()

    val connFactory = {
        var conn = connStorage.get()
        if (conn == null) {
           conn = driver.open(connString)
           connStorage.set(conn)
        }

        conn
    }

    val instance = startDatabaseViewerServerShared(
        port = 3000,
        queryable = SqliteQueryable(connFactory),
        assetProvider = EmptyStaticAssetProvider()
    )

    val port = instance.state.filterIsInstance<StartedInstance.State.Running>()
        .first()
        .port

    println("Server started at http://localhost:$port")

    // Wait for ctrl-c signal
    val shutdownSignal = Channel<Unit>(capacity = 1)
    Runtime.getRuntime().addShutdownHook(object : Thread() {
        override fun run() {
            shutdownSignal.trySend(Unit)
        }
    })

    shutdownSignal.receive()
    instance.stop()
    instance.state.filterIsInstance<StartedInstance.State.Stopped>().first()
    println("Server stopped")
}