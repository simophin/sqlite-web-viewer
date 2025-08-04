// ...existing code from main/java/dev/fanchao/sqliteviewer/DatabaseViewerServer.kt...
package dev.fanchao.sqliteviewer

import android.content.Context
import kotlinx.io.asSource


class AndroidAssetProvider(private val context: Context) : StaticAssetProvider {
    override fun openAsset(path: String) = runCatching {
        context.assets.open("webapp$path").asSource()
    }.getOrNull()
}
