package dev.fanchao.demoapp

import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import dev.fanchao.sqliteviewer.DatabaseViewerService

class ViewerService : DatabaseViewerService() {
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

    override fun openDatabase(): SupportSQLiteDatabase {
        return factory.writableDatabase
    }
}