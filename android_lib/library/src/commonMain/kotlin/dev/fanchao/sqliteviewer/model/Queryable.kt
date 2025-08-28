
package dev.fanchao.sqliteviewer.model

interface Queryable {
    fun runInTransaction(
        queries: Sequence<Query>
    ): QueryResults
}
