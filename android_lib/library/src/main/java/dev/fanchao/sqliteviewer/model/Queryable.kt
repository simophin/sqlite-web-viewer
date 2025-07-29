package dev.fanchao.sqliteviewer.model

interface Queryable {
    val dbVersion: Version

    fun runInTransaction(
        queries: Sequence<Query>
    ): QueryResults
}
