package expo.modules.archivenative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native archive reader, backed by libarchive.
 *
 * libarchive reads RAR5, 7z, zip and tar through one code path, under a
 * permissive BSD licence. It cannot open password-protected RAR archives — the
 * app already has a message for that case.
 *
 * Both real functions are async, so decompressing a large archive runs off the
 * JavaScript thread and the screen keeps responding.
 */
class ArchiveNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ArchiveNative")

    Function("libarchiveVersion") {
      return@Function ArchiveBridge.libarchiveVersion()
    }

    AsyncFunction("listEntries") { uri: String ->
      return@AsyncFunction ArchiveBridge.listEntries(ArchiveBridge.toFilePath(uri))
    }

    AsyncFunction("extractAll") { uri: String, destination: String ->
      return@AsyncFunction ArchiveBridge.extractAll(
        ArchiveBridge.toFilePath(uri),
        ArchiveBridge.ensureDirectory(destination),
      )
    }
  }
}
