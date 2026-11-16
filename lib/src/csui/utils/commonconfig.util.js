/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  function enableFeatureInSmartView() {
    let config = module.config();
    return config.enableFeature;
  }
  function enableSideBar() {
    let flagName = "useSideBar";
    let expression = new RegExp("[?&]" + flagName + "(?:=([^&]*))?", "i");
    let result = expression.exec(location.href);
    return false && (enableFeatureInSmartView() && (result ? result[1] != null ? decodeURIComponent(result[1]) : true : null));
  }
  return {
    enableFeatureInSmartView: enableFeatureInSmartView,
    enableSideBar: enableSideBar
  };
});