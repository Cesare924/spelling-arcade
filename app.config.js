// Adds build-time switches on top of app.json.
// SHOW_SUPPORT_LINK=false hides the "Buy me a coffee" button (store builds set it in eas.json).
// Store builds (EAS "preview" and "production") also drop Android permissions the app never uses,
// so the store listing shows only what the app needs. Local test builds are unchanged.
const STORE_BUILD = ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE || '');
const UNUSED_ANDROID_PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.RECORD_AUDIO',
];

module.exports = ({ config }) => ({
  ...config,
  android: STORE_BUILD
    ? { ...config.android, blockedPermissions: [...new Set([...(config.android?.blockedPermissions || []), ...UNUSED_ANDROID_PERMISSIONS])] }
    : config.android,
  extra: {
    ...config.extra,
    showSupportLink: process.env.SHOW_SUPPORT_LINK !== 'false',
    supportUrl: 'https://buymeacoffee.com/mateo2',
    // Public website / privacy policy address, once it's hosted (for example on GitHub Pages).
    websiteUrl: process.env.WEBSITE_URL || 'https://cesare924.github.io/spelling-arcade/',
  },
});
