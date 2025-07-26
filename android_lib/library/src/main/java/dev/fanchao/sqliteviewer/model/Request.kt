package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Request(
    @SerialName("run_in_transaction") val runInTransaction: Boolean = true,
    val queries: List<Query>,
)