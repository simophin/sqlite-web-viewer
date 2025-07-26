package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.Serializable

@Serializable
data class Query(val sql: String, val params: List<String>)