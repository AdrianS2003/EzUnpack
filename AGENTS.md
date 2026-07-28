# Working on EzUnpack

## Expo has changed

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Do not rely on remembered APIs — `expo-file-system` and
`expo-media-library` both replaced their old interfaces in recent SDKs, and the
old shapes still appear all over the internet.

Better still, read the type definitions in `node_modules`. They describe what is
actually installed, which the documentation occasionally does not.

## The build loop

A full app build takes about 15 minutes. The native module alone takes about
one:

```bash
cd android && ./gradlew :archive-native:assembleDebug
```

When changing native code, iterate on the module and only build the whole app
once it compiles. Every native problem below was found this way; each would have
cost a quarter of an hour otherwise.

JavaScript and TypeScript changes need no build at all — `npm start` and reload.

## Environment traps already hit

These cost real time. They are written down so nobody pays twice.

**A half-downloaded NDK.** This machine has two NDKs, one of them a stub with a
single file and no `source.properties`. The app builds because the
`expo-root-project` plugin pins a version; a new module that does not set
`ndkVersion` gets AGP's default instead and lands on the broken one. Any module
compiling native code must inherit the same version:

```gradle
android {
  ndkVersion rootProject.ext.ndkVersion
}
```

**CMake in the Android SDK is 3.22.** Keywords added later — such as
`DOWNLOAD_EXTRACT_TIMESTAMP` — are not rejected; they are silently folded into
the previous argument's list, producing errors that name something else
entirely.

**`-Werror` applies to vendored C.** A harmless unused variable in someone
else's release tarball will fail the build. Relax it per target, never globally:

```cmake
target_compile_options(${THIRD_PARTY_TARGET} PRIVATE -Wno-error)
```

**16 KB page alignment.** Android 15 devices with 16 KB memory pages refuse to
load libraries aligned to the old 4 KB. Everything React Native and Expo ship is
already aligned; anything we build is not, unless asked:

```cmake
target_link_options(mylib PRIVATE "-Wl,-z,max-page-size=16384")
```

Check with the NDK's `llvm-readelf -l <lib>.so` and look at the `LOAD` rows.

**Stale native build artifacts.** After adding a native module, CMake can see
the same sources through two different paths and silently skip an object file.
The failure looks like a missing `.o` late in the link. Clean before rebuilding:

```bash
cd android && ./gradlew --stop        # the daemon holds a handle on .cxx
rm -rf android/app/.cxx android/app/build android/build
find node_modules -maxdepth 3 -type d -path "*/android/build" -exec rm -rf {} +
```

**`expo-modules-core` is not hoisted.** It lives under `node_modules/expo/`, so
neither Metro nor TypeScript resolves it from a local module. Import
`requireNativeModule` from `expo` instead, which re-exports it.

## Do not guess at MIME types

Android content providers disagree about what an archive is. Samsung reports
`.rar` as `application/rar`; other providers use `application/vnd.rar` or
`application/x-rar-compressed` for the same file. Guessing produced two separate
bugs: an archive greyed out in the picker, and the app missing from the
"Open with" list.

Ask the device:

```bash
adb shell content query --uri content://media/external/file \
  --projection _display_name:mime_type --where "_display_name LIKE '%.rar'"
```

The list lives in `archive-mime-types.json`, read by both the picker and the
config plugin that writes the intent filter, so the two cannot drift apart.

## House style

- Every user-facing string goes in `src/i18n/strings.ts`, in both languages.
  Nothing is written inline, and nothing reaches the user in English only.
- Colours, radii and font weights come from `src/theme/tokens.ts` via
  `useApp()`. Screens never hardcode them.
- Comments explain *why*, especially where the code looks odd — a single-pass
  extraction, an `octet-stream` left in a filter, a copy made before a hash.
  The unusual choices in this codebase are usually load-bearing.
- Run `npx tsc --noEmit` and `npx eslint src modules` before calling anything
  done. The lint rules include React's hook rules, which catch real bugs here.
