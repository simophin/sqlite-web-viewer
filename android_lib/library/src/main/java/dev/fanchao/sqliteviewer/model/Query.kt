package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.Serializable

@Serializable
data class Query(
    val sql: String,
    val params: List<String>,
)

@Serializable
data class ConditionalQuery(
    val sql: String,
    val params: List<String>,
    val conditions: Map<@Serializable(with = VersionCondSerializer::class) VersionCondition, Query>? = null,
) {
    fun getQuery(dbVersion: Version): Query {
        return conditions?.entries?.firstOrNull { (cond, _) ->
            when {
                cond is VersionCondition.AtLeast && cond.inclusive -> dbVersion >= cond.version
                cond is VersionCondition.AtLeast -> dbVersion > cond.version
                cond is VersionCondition.AtMost && cond.inclusive -> dbVersion <= cond.version
                cond is VersionCondition.AtMost -> dbVersion < cond.version
                cond is VersionCondition.Exactly -> dbVersion == cond.version
                else -> false
            }
        }?.value
            ?: Query(
                sql = sql,
                params = params
            )
    }
}