package dev.fanchao.sqliteviewer

import dev.fanchao.sqliteviewer.model.Queryable
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.pin
import kotlinx.cinterop.refTo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.io.Buffer
import kotlinx.io.RawSource
import platform.Foundation.NSBundle
import platform.Foundation.NSInputStream

class NSInputStreamRawResource(private val inputStream: NSInputStream) : RawSource {
    @OptIn(ExperimentalForeignApi::class)
    val internalBuffer = UByteArray(8192).pin() // 8KB buffer

    override fun close() = inputStream.close()

    @OptIn(ExperimentalForeignApi::class)
    override fun readAtMostTo(sink: Buffer, byteCount: Long): Long {
        val bytesRead = inputStream.read(internalBuffer.addressOf(0), byteCount.toULong())
        if (bytesRead <= 0) {
            return -1 // End of stream or error
        }

        sink.write(internalBuffer.get().asByteArray(), 0, bytesRead.toInt())
        return bytesRead
    }
}

class NSBundleAssetProvider : StaticAssetProvider {
    override fun openAsset(path: String): RawSource? {
        return NSBundle.mainBundle.URLForResource(name = path, withExtension = null)?.let { filePath ->
            NSInputStreamRawResource(
                inputStream = NSInputStream(filePath)
            )
        }
    }
}

fun startDatabaseViewerServer(
    port: Int,
    queryable: Queryable
) {
    GlobalScope.launch {
        startDatabaseViewerServerShared(
            port = port,
            queryable = queryable,
            assetProvider = NSBundleAssetProvider()
        )
    }
}