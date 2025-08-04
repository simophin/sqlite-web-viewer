package dev.fanchao.sqliteviewer

import kotlinx.io.RawSource

interface StaticAssetProvider {
    fun openAsset(path: String): RawSource?
}