const mimeTypes = require('./archive-mime-types.json');

/**
 * The Expo config is JavaScript rather than JSON so that the share filter can be
 * built from `archive-mime-types.json` — the same list the picker and the "Open
 * with" filter already read. A third hand-maintained copy of those types is
 * exactly where the next "greyed out in the picker, missing from Open with" bug
 * would come from; that one cost two separate debugging sessions.
 *
 * The share sheet gets `pickerExtras` as well as `types`, matching the picker
 * rather than the "Open with" list. The reasoning is the same as it is there: a
 * share is something the user started, so `application/octet-stream` costs them
 * at worst an extra row to scroll past, while leaving it out would hide EzUnpack
 * from every app that hands over a document without identifying it — and several
 * do. The "Open with" list stays strict, because that one is unsolicited: there,
 * octet-stream would make EzUnpack volunteer for every unrecognised file on the
 * phone.
 */
const SHARE_MIME_TYPES = [...mimeTypes.types, ...mimeTypes.pickerExtras];

module.exports = {
  expo: {
    name: 'EzUnpack',
    slug: 'ez-unpack',
    version: '1.0.0',
    scheme: 'ezunpack',
    orientation: 'portrait',
    // The app follows the phone's light/dark setting unless the user overrides
    // it in Settings, so the shell must be allowed to do the same.
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#F0F4F8',
        },
      ],
      'expo-status-bar',
      [
        'expo-media-library',
        {
          photosPermission: 'EzUnpack shows you the photos it has saved for you.',
          savePhotosPermission: 'EzUnpack puts the photos from your archives into Photos.',
          isAccessMediaLocationEnabled: false,
          // Photos and videos only. The plugin declares READ_MEDIA_AUDIO by
          // default, and this app never touches an audio file — an extra
          // permission is one more thing to justify on the Data Safety form and
          // one more line in the list Android shows the user.
          granularPermissions: ['photo', 'video'],
        },
      ],
      [
        'expo-share-intent',
        {
          androidIntentFilters: SHARE_MIME_TYPES,
          disableIOS: true,
        },
      ],
      './plugins/with-archive-open-with',
      'expo-sharing',
    ],
    android: {
      package: 'ro.sacomplex.ezunpack',
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
        backgroundColor: '#FFFFFF',
      },
    },
    extra: {
      router: {},
      eas: {
        projectId: '4a077311-eede-437c-9d3c-0116949914f2',
      },
    },
  },
};
