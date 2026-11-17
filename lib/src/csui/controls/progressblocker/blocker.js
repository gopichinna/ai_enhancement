/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "smart/controls/progressblocker/blocker" ], function(module, _, SmartBlocker) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    delay: 10,
    disableDelay: 10,
    globalOnly: false
  });
  SmartBlocker.setModuleConfigs(config);
  return SmartBlocker;
});