package dev.fanchao.sqliteviewer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class CopyTextReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val textToCopy = intent.getStringExtra(EXTRA_TEXT) ?: return

        // Use the ClipboardManager to copy the text
        val clipboard =
            context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
        val clip = android.content.ClipData.newPlainText("Copied Text", textToCopy)
        clipboard.setPrimaryClip(clip)

        Toast.makeText(context, "\"$textToCopy\" copied", Toast.LENGTH_SHORT).show()
    }

    companion object {
        const val EXTRA_TEXT = "text_to_copy"
    }
}