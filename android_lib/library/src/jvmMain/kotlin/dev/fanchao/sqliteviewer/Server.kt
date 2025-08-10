package dev.fanchao.sqliteviewer

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
    val conn = driver.open(":memory:")
    conn.prepare("CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)").use { it.step() }
    conn.prepare("INSERT INTO test (name) VALUES ('Alice'), ('Bob')").use { it.step() }

    val instance = startDatabaseViewerServerShared(
        port = 3000,
        queryable = SqliteQueryable(conn),
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