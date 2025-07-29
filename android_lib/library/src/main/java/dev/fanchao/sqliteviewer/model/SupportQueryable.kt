package dev.fanchao.sqliteviewer.model

import android.os.SystemClock
import androidx.sqlite.db.SupportSQLiteDatabase

class SupportQueryable(private val db: SupportSQLiteDatabase) : Queryable {
    override val dbVersion: Version by lazy {
        db.query("SELECT sqlite_version() AS version")
            .use { cursor ->
                require(cursor.moveToNext()) {
                    "Failed to retrieve SQLite version from the database."
                }

                Version.fromString(cursor.getString(0))
            }
    }

    override fun runInTransaction(queries: Sequence<Query>): QueryResults {
        val start = SystemClock.elapsedRealtimeNanos()
        db.beginTransaction()
        return try {
            val results = queries
                .mapNotNull { query ->
                    db.query(query.sql, query.params.toTypedArray())
                        .use { cursor ->
                            if (cursor.moveToNext()) {
                                QueryResult.fromCursor(numAffected = 0, cursor)
                            } else {
                                null
                            }
                        }
                }
                .toList()

            db.setTransactionSuccessful()
            QueryResults(
                executionTimeUs = (SystemClock.elapsedRealtimeNanos() - start) / 1000L,
                results = results
            )
        } finally {
            db.endTransaction()
        }
    }
}
