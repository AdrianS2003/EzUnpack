# EzUnpack

An archive opener for people who are not comfortable with phones — parents,
grandparents, anyone who receives a `.zip` on WhatsApp and has no idea what to
do with it.

The design rules that drive every decision in this repo:

- **One green button per archive.** Minimum 64px tall, an icon and a verb.
- **No jargon.** "Small file - 4 MB", not "4.2 MiB". "Save to Photos & Docs",
  not "extract to destination".
- **Plain-language endings.** After saving, the app says where the files went,
  and can show them.
- **Nothing gets lost.** Every archive handed to the app is copied into the
  app's own folder, so it survives restarts and expiring permissions.
- **Two looks.** *Minimalist* is the calm default. *Bold* is a high-contrast,
  thick-border theme for weaker eyesight.
- **Romanian and English**, following the phone's language on first launch.

## What works today

The whole path is real — a file goes in, photos come out in the gallery:

- **ZIP, RAR5 and 7z**, read by libarchive through a local native module
  ([`modules/archive-native`](modules/archive-native)). No format is simulated.
- **Three ways in:** *Share → EzUnpack* from WhatsApp or Gmail, *Open with →
  EzUnpack* from a file manager, or the in-app file picker.
- **Photos and videos** land in their own **EzUnpack album** in the gallery, not
  loose in the camera roll.
- **Everything else** stays in the app, viewable through the folder screen, and
  can be opened or sent onwards from there.
- **Duplicate detection by content**, because WhatsApp renames files to internal
  identifiers and the same archive would otherwise appear twice.
- **Deleting an archive** throws away our copy and everything unpacked from it.
  Photos and videos are deliberately left in the gallery: they were handed to
  the phone's own Photos app, which is where the user was told to look for them.
- A **first-run screen** explaining the gallery permission in plain words before
  Android's own dialog appears.
- Both themes, both languages, bigger text, confirm-before-saving — all
  persisted across restarts.

Still simulated:

- **Voice search** — the microphone dialog fakes a result after 2.2s.
- **Video guides** — the tab and thumbnails exist; there are no videos yet.
- **Save sound** — vibrates instead; needs `expo-audio` and an audio asset.

Known gaps, roughly in the order they will hurt:

1. **The app icon is still Expo's.**
2. **Password-protected archives** cannot be opened. libarchive does not do RAR
   encryption; that would mean swapping in the official UnRAR sources.
3. **No way to reclaim orphaned space.** Deleting works per archive; folders
   left behind by archives that vanished some other way are never swept up.
4. **Debug APKs package one architecture.** Fine on the build machine's phone,
   useless to hand to someone else — see *Shipping* below.

## Run it

Expo SDK 57 / React Native 0.86. Development happens against a **development
build**, not Expo Go: the app has native code of its own.

Prerequisites, once:

- Android Studio, with the latest Android SDK Platform, Build-Tools and NDK
  installed from the SDK Manager
- A JDK — use the one bundled with Android Studio and point `JAVA_HOME` at it
- `ANDROID_HOME` set to the SDK path
- A phone with USB debugging, or an emulator image

```bash
npm install
npm run android      # compiles the native app and installs it — 15 minutes
```

After that first build, day-to-day work is just:

```bash
npm start            # press "a" to open the installed dev build
```

Rebuild with `npm run android` **only** when native code or a native dependency
changes. JavaScript and TypeScript reload over the network.

See [AGENTS.md](AGENTS.md) before touching anything native — it lists the
environment traps this project has already walked into.

## Layout

```
modules/archive-native/   local Expo module: libarchive over JNI
plugins/                  config plugin adding the "Open with" intent filter
src/
  app/                    expo-router screens: index (home), guide, settings
  archive/                reading, extracting, importing, opening files
  components/             header, cards, sheets, tab bar, icons, primitives
  data/                   the Archive and ArchiveEntry shapes
  i18n/                   every user-facing string, EN + RO
  state/                  preferences, persisted
  theme/                  the two design token sets + font weights
archive-mime-types.json   shared by the picker and the intent filter
```

`src/theme/tokens.ts` is the single source of visual truth. Screens never
hardcode a colour or radius; they read `k.*` from `useApp()`.

`src/archive/` is where the real work happens:

| File | Role |
| --- | --- |
| `native.ts` | the only import of the local native module |
| `unpack.ts` | extract, then route each file to gallery or app folder |
| `library.ts` | our own copy of every archive handed to us |
| `contents.ts` | the manifest of an unpacked archive, and opening its files |
| `kinds.ts` | what counts as a photo, a video, a document |
| `incoming.ts` | holds a file the OS handed us before React was ready |

## Shipping

The `android/` folder is generated by Expo prebuild and is deliberately
gitignored — never edit it by hand. Native configuration belongs in
[`app.json`](app.json); after changing anything there (icons, package name,
plugins), regenerate with:

```bash
npx expo prebuild --platform android --clean
```

`eas.json` builds a shareable APK for real testers:

```bash
npx eas-cli build --profile preview --platform android
```

Before handing an APK to anyone, check it contains every architecture — debug
builds often package only the build machine's:

```bash
unzip -l app.apk | grep "lib/"
```

## Where this goes next

**Soon.** A real app icon. Testing with an actual target user — everything past
this point is guesswork until someone who has never seen the app tries to open a
photo their grandchild sent them.

**Later.** The video guides, which the audience will use more than any written
help. A sound on save. An email address for feedback.

**The open question: automatic discovery.** The original idea was that the app
finds archives by itself and the user never browses folders. That promise is
currently unmet — files arrive by share, open-with, or picker. Delivering it on
modern Android means either broad storage access, which Google grants
reluctantly, or asking the user to select a folder once, which fits this
audience badly. It may turn out that *Open with* is enough in practice, and the
original promise was less necessary than it looked. Worth deciding deliberately
rather than by default.

**iOS, much later.** Sandboxing makes discovery impossible there, so iOS would
be a share-extension app with a different home screen. The archive engine and
design system would carry over; the entry points would not.
