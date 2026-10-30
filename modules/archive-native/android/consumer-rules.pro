# libarchive_native.so finds its functions by name: the C++ side exports
# Java_expo_modules_archivenative_ArchiveBridge_listEntries and so on. If R8
# renamed ArchiveBridge or its external methods, the first archive opened in a
# release build would fail with UnsatisfiedLinkError — a crash a debug build
# never shows. AGP's default rules usually cover native methods, but which
# default file the app template uses has changed between versions; this keeps
# the guarantee with the module that needs it.
-keepclasseswithmembernames class expo.modules.archivenative.ArchiveBridge {
    native <methods>;
}
