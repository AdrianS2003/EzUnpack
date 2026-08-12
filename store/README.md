# Getting EzUnpack onto Play

What is ready, what is left, and which of it only you can do.

Files in this folder are for the console, not for the app — nothing here is
bundled or shipped.

| File | What it is for |
| --- | --- |
| `privacy-policy.html` | The copy that gets hosted. Self-contained, both languages, one URL. |
| `privacy-policy.md` | The same text, readable in the repo. If you change one, change the other. |
| `listing.md` | Title, short and full descriptions in English and Romanian, plus what to photograph for the screenshots. |
| `data-safety.md` | Every answer for the Data Safety form and the content rating questionnaire, with the reasoning. |
| `play-icon-512.png` | The 512 × 512 store icon, flattened onto white. Play rejects an alpha channel, so this one has none — verified, not assumed. |

## Already done, in the app

- **Release bundle format.** `eas.json`'s `production` profile builds an
  `app-bundle` with `autoIncrement`, which is what Play wants. Nothing to change.
- **All four architectures.** `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` are in
  `gradle.properties`, so a release bundle covers every device. The
  one-architecture problem only ever affected debug APKs.
- **16 KB page alignment — verified, not assumed.** A release APK was built and
  `libarchive_native.so` pulled back out of it; every `LOAD` segment reports an
  alignment of `0x4000`. It will load on Android 15 devices with 16 KB memory
  pages. Google requires this of new submissions and it is easy to miss.

  ```bash
  unzip -o app-release.apk lib/arm64-v8a/libarchive_native.so
  "$ANDROID_HOME"/ndk/*/toolchains/llvm/prebuilt/*/bin/llvm-readelf -l libarchive_native.so
  ```

- **The release bundle builds, and was taken apart.**
  `./gradlew -p android :app:bundleRelease` succeeds. Inside the `.aab`: the JS
  bundle is embedded as `base/assets/index.android.bundle` rather than served by
  Metro, all four architectures carry `libarchive_native.so`, and the manifest
  names `ro.sacomplex.ezunpack` with no trace of the old package. Native debug
  symbols ride along under `BUNDLE-METADATA`, so Play will symbolicate native
  crashes rather than showing raw addresses.

  **That bundle cannot be uploaded.** Expo's generated `release` build type is
  signed with the debug key, which Play refuses. The uploadable artifact comes
  from EAS, which holds the upload key:

  ```bash
  npx eas-cli build --profile production --platform android
  ```

  The local build's job is a different one: proving the release path compiles
  and packages before you spend time in a queue.

  If it fails on a locked file under `node_modules/*/android/build`, the Gradle
  daemon from a previous build is still holding it — Windows will not delete an
  open file. `./gradlew -p android --stop`, remove that module's `build`
  directory, and run again.
- **Target API 36.** Expo SDK 57's default, which satisfies the current
  requirement. Worth confirming against the console at upload; it is a one-line
  check, not a task.
- **No `RECORD_AUDIO`, no `MANAGE_EXTERNAL_STORAGE`, no ad ID.** The three
  permissions Google scrutinises hardest, none of them needed. Voice search
  borrows the phone's own speech dialog, and files arrive and leave through
  system pickers.
- **No `READ_MEDIA_AUDIO`.** Removed; the app never touches an audio file.
- **The share sheet is honest.** EzUnpack now offers itself only for archives and
  for unidentified files, not for every photo and link on the phone.

## Left to do, in this order

**1. Host `privacy-policy.html` and paste its URL into the console.**
It is a single self-contained file — no stylesheet, no fonts, no scripts to
fetch — so it works on any host that can serve a file. Both languages are on the
one page, which is what you want: Play takes a single URL.

The URL is a required field, so nothing else proceeds without it. Three ways,
cheapest first:

- **GitHub Pages.** This repo has no remote yet. Create one, push, and switch
  Pages on for the `master` branch; the policy lands at
  `https://<user>.github.io/<repo>/store/privacy-policy.html`. Free and stable,
  but Pages on a *private* repo needs a paid plan, so on the free tier this
  publishes the source as well. That may be fine — it is your app — but it is a
  decision, not a detail.
- **A separate public repo holding only this file.** Same as above without
  exposing the source. Two minutes of work and the tidiest answer if the code
  stays private.
- **Your own domain**, if `sacomplex` has one. This is the best long-term home:
  the address survives moving hosts, and a store listing that points at a domain
  you own reads better than one pointing at `github.io`.

Whatever you pick, the address has to keep working for as long as the app is
listed. Google re-checks it.

The same email, `sacomplex.media@gmail.com`, is the contact in the policy, the
`To:` line on the app's crash screen (`src/support.ts`), and the developer
contact in the listing. Change one and change all three.

**2. Take the screenshots.** `listing.md` says which four and what to avoid.
This is the only part that needs a phone and cannot be written in advance. Put a
real archive through the app first so nothing on screen is empty.

**3. Draw the feature graphic.** 1,024 × 500, no transparency. `listing.md` has
the layout notes.

**4. Build and upload to internal testing.**

```bash
npx eas-cli build --profile production --platform android
```

Upload to the **internal testing** track first, install from Play on a phone
that has never had a debug build on it, and open a real WhatsApp archive. This
catches what a debug build cannot: release signing, code shrinking, and the
absence of the dev client.

**5. Fill in the console forms** from `data-safety.md`, then submit for review.

## Worth doing before a wide audience, not blocking

- **A permanent way to write in.** The support address currently appears only on
  the crash screen. A "write to us" row in Settings would catch the person who
  is merely confused rather than crashed — and for this audience those outnumber
  the crashes.
- **Richer crash reporting.** Play Console's Android vitals collects native
  crashes and ANRs for free, with no code, and a fatal JS error reaches it as a
  native crash. The crash screen adds the user's own account of what they were
  doing. A tool like Sentry would add readable JS stacks — at the cost of
  declaring data collection on the store page, which today reads as none.
- **A pass with TalkBack on.** There are accessibility labels throughout, but
  nobody has yet run the app with the screen reader actually enabled — and this
  audience overlaps heavily with the people who use it.

## The thing that outranks all of the above

Fifteen minutes watching one person who has never seen the app try to open a
photo their grandchild sent them. Everything past the current feature set is
guesswork until that happens, and it may well reorder this whole list.
