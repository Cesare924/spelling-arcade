// Switches set at build time (see app.config.js and eas.json).
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, unknown>;
export const APP_VERSION = Constants.expoConfig?.version || '';
/** Show the "Buy me a coffee" button. Off in store builds until you turn it on. */
export const SHOW_SUPPORT_LINK = extra.showSupportLink !== false;
export const SUPPORT_URL = typeof extra.supportUrl === 'string' ? extra.supportUrl : 'https://buymeacoffee.com/mateo2';
/** Website with the privacy policy. Empty until it's hosted publicly. */
export const WEBSITE_URL = typeof extra.websiteUrl === 'string' && extra.websiteUrl ? extra.websiteUrl : 'https://cesare924.github.io/spelling-stars/';
export const PRIVACY_URL = WEBSITE_URL.replace(/\/?$/, '/') + '#privacy';
