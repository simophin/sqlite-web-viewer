package dev.fanchao.demoapp

import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import dev.fanchao.demoapp.databinding.ActivityMainBinding
import dev.fanchao.sqliteviewer.StartedInstance
import dev.fanchao.sqliteviewer.model.Queryable
import dev.fanchao.sqliteviewer.model.QueryableFactory
import dev.fanchao.sqliteviewer.model.SupportQueryable
import dev.fanchao.sqliteviewer.startDatabaseViewerServer

class MainActivity : ComponentActivity() {
    // A few independent in-memory databases, each seeded with its own schema.
    // They are resolved lazily so connections only open when first viewed.
    private val databases: Map<String, Lazy<Queryable>> = mapOf(
        "users" to lazy {
            inMemoryDatabase(
                "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL)",
                "INSERT INTO users (name, email) VALUES ('Ada', 'ada@example.com'), ('Alan', 'alan@example.com')",
            )
        },
        "products" to lazy {
            inMemoryDatabase(
                "CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price_cents INTEGER NOT NULL)",
                "INSERT INTO products (name, price_cents) VALUES ('Widget', 1299), ('Gadget', 4999)",
            )
        },
        "logs" to lazy {
            inMemoryDatabase(
                "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, message TEXT NOT NULL)",
                "INSERT INTO logs (level, message) VALUES ('INFO', 'Started'), ('WARN', 'Low memory')",
            )
        },
    )

    // Consulted afresh on every request: the index lists whatever keys exist and
    // each id resolves (opening the connection on demand) to its queryable.
    private val queryableFactory = object : QueryableFactory {
        override fun databaseIds(): Collection<String> = databases.keys
        override fun queryableFor(id: String): Queryable? = databases[id]?.value
    }

    private fun inMemoryDatabase(vararg seedStatements: String): Queryable {
        val helper = FrameworkSQLiteOpenHelperFactory().create(
            SupportSQLiteOpenHelper.Configuration(
                context = this,
                name = ":memory:",
                callback = object : SupportSQLiteOpenHelper.Callback(1) {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        seedStatements.forEach(db::execSQL)
                    }

                    override fun onUpgrade(
                        db: SupportSQLiteDatabase,
                        oldVersion: Int,
                        newVersion: Int
                    ) {
                    }
                },
                useNoBackupDirectory = true,
                allowDataLossOnRecovery = false
            )
        )
        return SupportQueryable(helper.writableDatabase)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val binding = ActivityMainBinding.inflate(LayoutInflater.from(this))
        setContentView(binding.root)

        var instance: StartedInstance? = null

        binding.start.setOnClickListener {
            instance = startDatabaseViewerServer(
                context = this,
                port = 3000,
                factory = queryableFactory,
            )

            binding.start.isEnabled = false
            binding.stop.isEnabled = true
        }

        binding.stop.setOnClickListener {
            instance?.stop()
            instance = null

            binding.start.isEnabled = true
            binding.stop.isEnabled = false
        }
    }
}
