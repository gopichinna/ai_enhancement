/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.plugins/impl/brava.plugin" ], function(BravaPlugin) {
  "use strict";
  return [ {
    sequence: 200,
    plugin: BravaPlugin,
    decides: BravaPlugin.isSupported
  } ];
});