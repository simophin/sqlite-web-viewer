package dev.fanchao.sqliteviewer

import android.app.Activity
import android.os.Bundle
import dev.fanchao.sqliteviewer.databinding.ActivityPermissionRequestBinding

class PermissionRequestActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val binding = ActivityPermissionRequestBinding.inflate(layoutInflater)

        setContentView(binding.root)

        binding.grant.setOnClickListener {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 0)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String?>,
        grantResults: IntArray
    ) {
        if (requestCode == 0 && grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            setResult(RESULT_OK)
            // Permission granted, finish the activity
            finish()
        }
    }
}