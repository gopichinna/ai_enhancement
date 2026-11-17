(function () {
  'use strict';
  console.log('[D2SV-AI-Summary] >>> d2svaisummary-init.js EXECUTING <<<');

  if (typeof sv === 'undefined') {
    console.error('[D2SV-AI-Summary] ERROR: Global "sv" object is undefined! SmartView startup hooks not available.');
    return;
  }

  const {
    bootHold,
    addBundleIndex,
    addExtension,
    config
  } = sv;

  console.log('[D2SV-AI-Summary] SmartView context found. Holding boot...');
  const promise = bootHold();

  const extensionPath = 'd2svaisummary/d2svaisummary-extensions.json';
  console.log('[D2SV-AI-Summary] Registering extension:', extensionPath);
  addExtension(extensionPath);

  const bundlePath = `${config.otherBundlesLocation}/d2svaisummary/bundles/d2svaisummary-index.js`;
  console.log('[D2SV-AI-Summary] Registering bundle index:', bundlePath);
  addBundleIndex(bundlePath);

  promise.resolve();
  console.log('[D2SV-AI-Summary] >>> d2svaisummary-init.js completed & boot released <<<');
})();



