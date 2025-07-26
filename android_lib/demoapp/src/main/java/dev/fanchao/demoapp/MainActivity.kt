package dev.fanchao.demoapp

import android.os.Bundle
import android.view.LayoutInflater
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import dev.fanchao.demoapp.databinding.ActivityMainBinding
import dev.fanchao.sqliteviewer.DatabaseViewerService

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val binding = ActivityMainBinding.inflate(LayoutInflater.from(this))
        setContentView(binding.root)

        binding.start.setOnClickListener {
            startService(
                DatabaseViewerService.createIntent<ViewerService>(
                    this@MainActivity,
                    DatabaseViewerService.COMMAND_ACTION_START
                )
            )
        }

        binding.stop.setOnClickListener {
            startService(
                DatabaseViewerService.createIntent<ViewerService>(
                    this@MainActivity,
                    DatabaseViewerService.COMMAND_ACTION_STOP
                )
            )
        }
    }
}
