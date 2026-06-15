# SQLite Web Viewer

Browse the SQLite databases inside your running app from a web browser. SQLite
Web Viewer embeds a tiny HTTP server in your application that serves a web UI
(built with [SolidJS](webapp/README.md)) for inspecting tables, running queries,
and viewing schema — no need to pull the database file off the device.

It is published as a [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
library, so the same viewer runs on **Android**, **JVM**, and **iOS**.

## Features

- Browse tables and views, sort and paginate
- Run raw SQL and see results as a table
- Inspect table/view schema
- Decode JSON-valued columns
- Auto-reload as data changes
- Serve a **single** database, or **many** databases behind an index page

## How it works

```
┌─────────────┐    HTTP     ┌──────────────────────────┐
│  Browser    │◄──────────► │  Embedded server (Ktor)  │
│  (web UI)   │   /query    │  in your app process     │
└─────────────┘             └────────────┬─────────────┘
                                          │ Queryable
                                          ▼
                                    Your SQLite db(s)
```

Your app supplies one or more `Queryable`s (an abstraction over "run these SQL
statements in a transaction"). The library serves the bundled web UI and proxies
its queries to your databases.

## Installation

The library is published to Maven Central (see [PUBLISHING.md](android_lib/PUBLISHING.md)):

```kotlin
dependencies {
    implementation("io.github.simophin:sqlite-web-viewer:<version>")
}
```

## Basic usage

### Android — a single database

```kotlin
val queryable = SupportQueryable(myOpenHelper.writableDatabase)

val instance = startDatabaseViewerServer(
    context = this,   // an Activity
    port = 3000,
    queryable = queryable,
)

// Later, to shut it down:
instance.stop()
```

Then open `http://<device-ip>:3000/` in a browser (e.g. via `adb forward
tcp:3000 tcp:3000` and visit `http://localhost:3000/`).

### Android — multiple databases (dynamic)

Instead of a fixed set, provide a `QueryableFactory`. It is consulted afresh on
every request, so the available databases can change at runtime, and each
`Queryable` is only resolved when a request actually targets it (handy for
opening connections on demand):

```kotlin
val factory = object : QueryableFactory {
    override fun databaseIds() = listOf("users", "products", "logs")

    override fun queryableFor(id: String): Queryable? = when (id) {
        "users"    -> SupportQueryable(usersDb)
        "products" -> SupportQueryable(productsDb)
        "logs"     -> SupportQueryable(logsDb)
        else       -> null   // → 404
    }
}

val instance = startDatabaseViewerServer(
    context = this,
    port = 3000,
    factory = factory,
)
```

This serves an index at `/` linking to `/users/`, `/products/`, and `/logs/`,
each with its own viewer. If you already hold every database up front, the map
form is equivalent:

```kotlin
startDatabaseViewerServer(
    context = this,
    port = 3000,
    factory = QueryableFactory(mapOf("users" to usersQueryable, /* ... */)),
)
```

See [`demoapp`](android_lib/demoapp) for a runnable example serving several
in-memory databases.

### JVM

```kotlin
val driver = BundledSQLiteDriver()
val queryable = SqliteQueryable { driver.open(":memory:") }

val instance = startDatabaseViewerServerShared(
    port = 3000,
    queryable = queryable,                       // or: databases = mapOf(...)
    assetProvider = ClasspathStaticAssetProvider(),
)
```

The JVM module also has a runnable `main` (`./gradlew :sqlite-web-viewer:jvmRun`),
configurable via the `DB_PATH` environment variable.

### iOS

```kotlin
startDatabaseViewerServer(port = 3000, queryable = queryable)
```

The web UI is served from the app bundle via `NSBundleAssetProvider`.

## Building locally

The web UI must be built before the library, since its bundle is packaged into
the artifact:

```sh
cd webapp
npm ci
npm run build

cd ../android_lib
./gradlew :sqlite-web-viewer:publishToMavenLocal   # or build the demo app
```

## Project layout

- `webapp/` — the SolidJS web UI ([README](webapp/README.md))
- `android_lib/library/` — the Kotlin Multiplatform embedded-server library
- `android_lib/demoapp/` — an Android sample app

## License

[MIT](LICENSE)
