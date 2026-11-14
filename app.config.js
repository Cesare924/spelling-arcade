// Adds build-time switches on top of app.json.
// SHOW_SUPPORT_LINK=false hides the "Buy me a coffee" button (store builds set it in eas.json).
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    showSupportLink: process.env.SHOW_SUPPORT_LINK !== 'false',
    supportUrl: 'https://buymeacoffee.com/mateo2',
    // Public website / privacy policy address, once it's hosted (for example on GitHub Pages).
    websiteUrl: process.env.WEBSITE_URL || 'https://cesare924.github.io/spelling-stars/',
  },
});
