
package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.Serializable

@Serializable
data class Request(
    val queries: List<Query>,
)
