(function () {
  'use strict';
  const {
    bootHold,
    addBundleIndex,
    addExtension,
    config
  } = sv;

  const promise = bootHold();

  addExtension('d2svaisummary/d2svaisummary-extensions.json');
  addBundleIndex(`${config.otherBundlesLocation}/d2svaisummary/bundles/d2svaisummary-index.js`);

  promise.resolve();
})();


