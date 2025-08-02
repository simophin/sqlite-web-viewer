
package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class QueryResult(
    @SerialName("num_affected") val numAffected: Int,
    val columns: List<ColumnInfo>,
    val rows: List<List<JsonPrimitive>>
)

@Serializable
data class QueryResults(
    @SerialName("execution_time_us")
    val executionTimeUs: Long,
    val results: List<QueryResult>
)
