cmake_minimum_required(VERSION 3.22)
project(archive_native LANGUAGES C CXX)

include(FetchContent)

# libarchive is built as a private static library with almost everything turned
# off. We only ever read archives, and every optional dependency is one more
# thing that has to cross-compile cleanly for four Android architectures.
# zlib stays on because the NDK ships it and zip needs deflate.
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
set(ENABLE_TEST OFF CACHE BOOL "" FORCE)
set(ENABLE_INSTALL OFF CACHE BOOL "" FORCE)
set(ENABLE_TAR OFF CACHE BOOL "" FORCE)
set(ENABLE_CPIO OFF CACHE BOOL "" FORCE)
set(ENABLE_CAT OFF CACHE BOOL "" FORCE)
set(ENABLE_UNZIP OFF CACHE BOOL "" FORCE)
set(ENABLE_OPENSSL OFF CACHE BOOL "" FORCE)
set(ENABLE_LIBXML2 OFF CACHE BOOL "" FORCE)
set(ENABLE_EXPAT OFF CACHE BOOL "" FORCE)
set(ENABLE_ICONV OFF CACHE BOOL "" FORCE)
set(ENABLE_ACL OFF CACHE BOOL "" FORCE)
set(ENABLE_XATTR OFF CACHE BOOL "" FORCE)
set(ENABLE_BZip2 OFF CACHE BOOL "" FORCE)
set(ENABLE_LZMA OFF CACHE BOOL "" FORCE)
set(ENABLE_ZSTD OFF CACHE BOOL "" FORCE)
set(ENABLE_LZ4 OFF CACHE BOOL "" FORCE)
set(ENABLE_LIBB2 OFF CACHE BOOL "" FORCE)
set(ENABLE_LIBGCC OFF CACHE BOOL "" FORCE)
set(ENABLE_PCREPOSIX OFF CACHE BOOL "" FORCE)
set(ENABLE_PCRE2POSIX OFF CACHE BOOL "" FORCE)
set(ENABLE_CNG OFF CACHE BOOL "" FORCE)
set(ENABLE_ZLIB ON CACHE BOOL "" FORCE)

# No DOWNLOAD_EXTRACT_TIMESTAMP here: that keyword arrived in CMake 3.24, and
# the Android SDK ships 3.22.1, which silently folds the unknown keyword into
# the URL list and then complains that the URL is not a URL.
FetchContent_Declare(
  libarchive
  URL https://github.com/libarchive/libarchive/releases/download/v3.8.8/libarchive-3.8.8.tar.gz
)
FetchContent_MakeAvailable(libarchive)

# libarchive names its target differently depending on BUILD_SHARED_LIBS.
if(TARGET archive_static)
  set(ARCHIVE_TARGET archive_static)
else()
  set(ARCHIVE_TARGET archive)
endif()

# The Android build treats warnings as errors, and libarchive has a few harmless
# ones (an unused variable in the mtree writer, for instance) that we are in no
# position to fix in someone else's release tarball. Relaxed for this target
# only — our own code stays strict.
target_compile_options(${ARCHIVE_TARGET} PRIVATE -Wno-error)

add_library(archive_native SHARED archive_jni.cpp)

# Android 15 introduced devices with 16 KB memory pages, and a shared library
# whose segments are aligned to the old 4 KB simply refuses to load there. Every
# library React Native and Expo ship is already aligned; ours was the only one
# that was not, so it is asked for explicitly rather than relied upon.
target_link_options(archive_native PRIVATE "-Wl,-z,max-page-size=16384")

target_include_directories(archive_native PRIVATE
  ${libarchive_SOURCE_DIR}/libarchive
)

target_link_libraries(archive_native
  ${ARCHIVE_TARGET}
  z
  log
)
