package dev.fanchao.demoapp

import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import dev.fanchao.demoapp.databinding.ActivityMainBinding
import dev.fanchao.sqliteviewer.model.SupportQueryable
import dev.fanchao.sqliteviewer.startDatabaseViewerServer
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlin.getValue

class MainActivity : ComponentActivity() {
    private val factory by lazy {
        FrameworkSQLiteOpenHelperFactory().create(
            SupportSQLiteOpenHelper.Configuration(
                context = this,
                name = ":memory:",
                callback = object : SupportSQLiteOpenHelper.Callback(1) {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        db.execSQL("CREATE TABLE tests (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, value TEXT NOT NULL)")
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
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val binding = ActivityMainBinding.inflate(LayoutInflater.from(this))
        setContentView(binding.root)

        var job: Job? = null

        binding.start.setOnClickListener {
            job = startDatabaseViewerServer(
                context = this,
                scope = GlobalScope,
                port = 3000,
                queryable = SupportQueryable(factory.writableDatabase)
            )

            if (job != null) {
                binding.start.isEnabled = false
                binding.stop.isEnabled = true
            }
        }

        binding.stop.setOnClickListener {
            job?.cancel()
            job = null

            binding.start.isEnabled = true
            binding.stop.isEnabled = false
        }
    }
}
