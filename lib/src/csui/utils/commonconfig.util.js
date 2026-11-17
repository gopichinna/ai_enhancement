/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  const config = module.config();
  function enableFeatureInSmartView() {
    return config.enableFeature;
  }
  function enableJatoBranding() {
    return config.jatoBranding ?? config.enableFeature ?? false;
  }
  function enableSideBar() {
    return config.enableSideBar ?? config.enableFeature ?? false;
  }
  return {
    enableFeatureInSmartView: enableFeatureInSmartView,
    enableSideBar: enableSideBar,
    enableJatoBranding: enableJatoBranding
  };
});