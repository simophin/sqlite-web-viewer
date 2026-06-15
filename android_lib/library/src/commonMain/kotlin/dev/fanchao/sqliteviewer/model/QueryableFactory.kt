package dev.fanchao.sqliteviewer.model

/**
 * Supplies the databases the viewer should expose, resolved lazily and afresh on
 * every request. This lets the host application add, remove, or rebuild databases
 * at runtime without restarting the server and without committing to a fixed set
 * of [Queryable]s up front.
 *
 * The two-step shape — list ids, then resolve one — means a [Queryable] is only
 * created when a request actually targets it (e.g. opening a connection on
 * demand) rather than for every database on every index render.
 */
interface QueryableFactory {
    /** Ids of the databases currently available; rendered on the index page. */
    fun databaseIds(): Collection<String>

    /**
     * The queryable for [id], or null if no such database is currently available
     * (which the server surfaces as a 404).
     */
    fun queryableFor(id: String): Queryable?
}

/**
 * A [QueryableFactory] backed by a fixed [databases] map — the static counterpart
 * to a custom factory, for callers that already hold every [Queryable].
 */
fun QueryableFactory(databases: Map<String, Queryable>): QueryableFactory =
    object : QueryableFactory {
        override fun databaseIds(): Collection<String> = databases.keys
        override fun queryableFor(id: String): Queryable? = databases[id]
    }
