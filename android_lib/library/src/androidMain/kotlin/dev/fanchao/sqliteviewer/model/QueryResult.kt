
package dev.fanchao.sqliteviewer.model

import android.database.Cursor
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

fun QueryResult.Companion.fromCursor(
    numAffected: Int,
    cursor: Cursor,
): QueryResult {
    val columns = List(cursor.columnCount) { index ->
        ColumnInfo(cursor.getColumnName(index))
    }

    val rows = buildList(capacity = cursor.count) {
        while (cursor.moveToNext()) {
            add(List(cursor.columnCount) { index ->
                cursor.getType(index).let { type ->
                    when (type) {
                        Cursor.FIELD_TYPE_NULL -> JsonNull
                        Cursor.FIELD_TYPE_INTEGER -> JsonPrimitive(cursor.getLong(index))
                        Cursor.FIELD_TYPE_FLOAT -> JsonPrimitive(cursor.getDouble(index))
                        Cursor.FIELD_TYPE_BLOB -> JsonPrimitive(cursor.getBlob(index).let { "BLOB(${it.size} bytes)" })
                        Cursor.FIELD_TYPE_STRING -> JsonPrimitive(cursor.getString(index))
                        else -> JsonPrimitive("")
                    }
                }
            })
        }
    }

    return QueryResult(numAffected, columns, rows)
}
