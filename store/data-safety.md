# Data Safety form — the answers, and why

Google's Data Safety form is where most small apps get themselves into trouble,
usually by over-declaring out of caution. Over-declaring is not the safe choice:
it puts a "collects your photos" label on the store page, which for this audience
is exactly the wrong first impression, and it commits you to claims you then have
to keep true.

The single distinction that decides almost every answer:

> **Google defines "collected" as transferred off the device.** Reading or
> writing a file locally is not collection. Accessing the gallery to save a photo
> into it is not collection.

EzUnpack transfers nothing off the device. It makes no network requests at all —
verified by searching the source for `fetch`, `XMLHttpRequest`, `WebSocket` and
any `http` URL, and by checking that no analytics, crash-reporting or backend SDK
is among the dependencies. So the form is short.

---

## Data collection and sharing

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |

Answering No closes the entire section. There are no data types to declare, no
purposes, no sharing partners.

## Security practices

These appear only if you declared collection. With **No** above, they do not
apply. For the record, if the form asks anyway:

| Question | Answer |
| --- | --- |
| Is all of the user data collected by your app encrypted in transit? | Not applicable — no data is collected |
| Do you provide a way for users to request that their data be deleted? | Not applicable — no data is collected |

Do not volunteer "data deletion" here. The app does let a user delete their
archives, but that is a local file, not their data held by you, and describing it
as the latter invites a reviewer to ask where you are keeping it.

## Permissions the reviewer will see, and the honest reason for each

The form does not ask for these, but the review does, and a mismatch between a
declared permission and a stated purpose is the usual reason a small app gets
pulled into manual review. Have these answers ready.

| Permission | Why it is there |
| --- | --- |
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` | To save photos and videos out of an archive into the gallery, and to show the user one afterwards. Android will not let an app grant another app read access to a photo it cannot read itself, so the read permission is required for the "show me the photo" button to work at all. |
| `READ_MEDIA_VISUAL_USER_SELECTED` | Android 14's partial-access variant of the above. Declared by `expo-media-library`. |
| `VIBRATE` | A short buzz when a save finishes. |
| `INTERNET` | Declared by React Native, the framework. The app makes no requests. |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Legacy, and already capped at `maxSdkVersion="32"`, so they do not apply on Android 13 or newer. |

Two permissions deliberately **not** requested, worth knowing you can point at:

- **`RECORD_AUDIO`** — voice search hands the microphone to the phone's own
  speech dialog through an intent rather than recording anything itself, so the
  app never holds microphone access.
- **`MANAGE_EXTERNAL_STORAGE`** ("All files access") — the app never browses the
  phone's storage. Files arrive by share, by "Open with", or through the system
  picker, and copies go out through the system's folder picker, which grants one
  folder at a time.

Both are the permissions Google scrutinises hardest. Not needing them is the
single biggest thing this app has going for it in review.

## Content rating questionnaire

Answer the questionnaire honestly and it lands at the lowest rating. The answers
are all No: no violence, no sexuality, no profanity, no controlled substances, no
gambling, no user-to-user communication, no sharing of user location, no
user-generated content.

One that trips people up: **"Does the app allow users to share content?"** The
app has a Send button that hands a file to Android's share sheet. That is the
system's sharing, between apps on one phone, not user-to-user communication
inside your app. Answer **No**.

## Target audience

- **Age group:** 18 and over, or 13 and over. Do **not** select a children's age
  group and do not opt into the Families programme. The app is not for children,
  and the Families programme adds a large set of requirements for no benefit
  here.
- **Appeals to children:** No.

## Ads and monetisation

- **Contains ads:** No
- **In-app purchases:** No
- **Ad ID permission:** Not declared, and must stay that way. Declaring
  `com.google.android.gms.permission.AD_ID` without ads is a common accidental
  policy violation; nothing in this project's dependencies adds it.
