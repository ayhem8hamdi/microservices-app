const path = require('path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    alias: {
      ...options.resolve?.alias,
      '@app/shared': path.resolve(__dirname, 'libs/shared/src'),
    },
  },
});