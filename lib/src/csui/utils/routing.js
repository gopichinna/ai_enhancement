/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore" ], function(module, _) {
  "use strict";
  var developmentPage = module.config().developmentPage;
  readOldSettings("csui/pages/start/perspective.routing");
  readOldSettings("csui/pages/start/impl/perspective.router");
  function readOldSettings(moduleName) {
    if (developmentPage === undefined) {
      var oldConfig = window.csui.requirejs.s.contexts._.config.config[moduleName] || {};
      developmentPage = oldConfig.developmentPage;
    }
  }
  return {
    routesWithSlashes: function() {
      return /\/app(?:\/.*)?$/.test(location.pathname) || !developmentPage;
    }
  };
});