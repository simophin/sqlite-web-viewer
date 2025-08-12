package dev.fanchao.sqliteviewer

import androidx.sqlite.SQLITE_DATA_BLOB
import androidx.sqlite.SQLITE_DATA_FLOAT
import androidx.sqlite.SQLITE_DATA_INTEGER
import androidx.sqlite.SQLITE_DATA_NULL
import androidx.sqlite.SQLiteConnection
import androidx.sqlite.SQLiteStatement
import dev.fanchao.sqliteviewer.model.ColumnInfo
import dev.fanchao.sqliteviewer.model.Query
import dev.fanchao.sqliteviewer.model.QueryResult
import dev.fanchao.sqliteviewer.model.QueryResults
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.Version
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

class SqliteQueryable(private val conn: SQLiteConnection) : Queryable {
    override val dbVersion: Version by lazy {
        conn.prepare("SELECT sqlite_version()").use { statement ->
            statement.step()
            Version.Companion.fromString(statement.getText(0))
        }
    }

    override fun runInTransaction(queries: Sequence<Query>): QueryResults {
        val start = System.currentTimeMillis()
        val results = queries
            .map {
                conn.prepare(it.sql).use { stmt ->
                    for ((paramIndex, param) in it.params.withIndex()) {
                        stmt.bindText(paramIndex + 1, param)
                    }

                    stmt.toQueryResult()
                }
            }
            .toList()

        val end = System.currentTimeMillis()

        return QueryResults(
            executionTimeUs = (end - start) * 1000, // Convert ms to us
            results = results
        )
    }
}

fun SQLiteStatement.toQueryResult(): QueryResult {
    val columns by lazy {
        List(getColumnCount()) {
            ColumnInfo(name = getColumnName(it))
        }
    }

    val columnGetter: List<() -> JsonPrimitive> by lazy {
        List(getColumnCount()) { colIndex ->
            when (getColumnType(colIndex)) {
                SQLITE_DATA_BLOB -> {
                    { JsonPrimitive("BLOB (${getBlob(colIndex).size} bytes)") }
                }

                SQLITE_DATA_NULL -> {
                    { JsonNull }
                }

                SQLITE_DATA_FLOAT -> {
                    { JsonPrimitive(getDouble(colIndex)) }
                }

                SQLITE_DATA_INTEGER -> {
                    { JsonPrimitive(getLong(colIndex)) }
                }

                else -> {
                    { JsonPrimitive(getText(colIndex)) }
                }
            }
        }
    }

    val rows = generateSequence {
        if (step()) {
            List(getColumnCount()) {
                columnGetter[it]()
            }
        } else {
            null
        }
    }.toList()

    return QueryResult(
        numAffected = -1, // Placeholder, as this is not a DML statement
        columns = columns,
        rows = rows
    )
}