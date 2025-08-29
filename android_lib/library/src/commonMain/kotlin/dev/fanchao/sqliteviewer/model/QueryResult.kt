package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonClassDiscriminator
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class QueryResult(
    @SerialName("num_affected") val numAffected: Int,
    val columns: List<ColumnInfo>,
    val rows: List<List<JsonPrimitive>>
)

@OptIn(ExperimentalSerializationApi::class)
@Serializable
@JsonClassDiscriminator("type")

sealed interface QueryResults {
    @Serializable
    @SerialName("success")
    data class Success(
        @SerialName("execution_time_us")
        val executionTimeUs: Long,
        val results: List<QueryResult>
    ) : QueryResults

    @Serializable
    @SerialName("error")
    data class Error(
        val message: String,
        val diagnostic: String? = null
    ) : QueryResults
}
