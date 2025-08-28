
package dev.fanchao.sqliteviewer.model

import androidx.sqlite.db.SupportSQLiteDatabase
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class SupportQueryable(private val db: SupportSQLiteDatabase) : Queryable {
    @OptIn(ExperimentalTime::class)
    override fun runInTransaction(queries: Sequence<Query>): QueryResults {
        val start = Clock.System.now()
        db.beginTransaction()
        return try {
            val results = queries
                .map { query ->
                    db.query(query.sql, query.params.toTypedArray())
                        .use { cursor -> QueryResult.fromCursor(numAffected = 0, cursor) }
                }
                .toList()

            db.setTransactionSuccessful()
            QueryResults.Success(
                executionTimeUs = (Clock.System.now() - start).inWholeMicroseconds,
                results = results
            )
        } finally {
            db.endTransaction()
        }
    }
}
