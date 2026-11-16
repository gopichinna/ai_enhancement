/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  return [ {
    decides: function(node) {
      return module.config().enabled && node.get("container");
    },
    important: true,
    module: "json!csui/utils/contexts/perspective/impl/perspectives/container.json"
  } ];
});