/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  "use strict";
  var _proxyEnabled = module.config().enabled || false;
  var _limitPerUser = module.config().limitPerUser || 15;
  var Proxy = {
    enabled: function() {
      return _proxyEnabled;
    },
    limitPerUser: function() {
      return _limitPerUser;
    }
  };
  return Proxy;
});