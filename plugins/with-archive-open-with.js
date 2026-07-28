const { withAndroidManifest } = require('expo/config-plugins');

const mimeTypes = require('../archive-mime-types.json');

/**
 * Puts EzUnpack in Android's "Open with" list for archive files.
 *
 * The share sheet ("Share -> EzUnpack") and the open-with list are two
 * different intents: sharing sends ACTION_SEND, which expo-share-intent already
 * handles, while tapping a file in WhatsApp or a file manager sends ACTION_VIEW
 * with the file's MIME type. Without a VIEW filter naming those types the app
 * simply never appears there.
 *
 * The type list is shared with the file picker so the two cannot drift apart.
 * `pickerExtras` is deliberately not included here: `application/octet-stream`
 * is fine for a picker the user opened on purpose, but in the Open with list it
 * would make EzUnpack volunteer for every unrecognised file on the phone.
 */
const ARCHIVE_MIME_TYPES = mimeTypes.types;

const SCHEMES = ['content', 'file'];

/**
 * Android merges every `<data>` element inside one filter attribute by
 * attribute: the intent matches when its scheme is in the scheme list AND its
 * MIME type is in the type list. That is why schemes and types are separate
 * entries rather than a cross product.
 */
function archiveViewFilter() {
  return {
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: [
      ...SCHEMES.map((scheme) => ({ $: { 'android:scheme': scheme } })),
      ...ARCHIVE_MIME_TYPES.map((mimeType) => ({ $: { 'android:mimeType': mimeType } })),
    ],
  };
}

module.exports = function withArchiveOpenWith(config) {
  return withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    const activity = application?.activity?.find(
      (entry) => entry.$?.['android:name'] === '.MainActivity',
    );

    if (!activity) {
      throw new Error('with-archive-open-with: .MainActivity not found in AndroidManifest.xml');
    }

    activity['intent-filter'] = activity['intent-filter'] ?? [];
    activity['intent-filter'].push(archiveViewFilter());

    return modConfig;
  });
};
