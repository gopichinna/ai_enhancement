/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.plugins/impl/brava.plugin", "csui/utils/commands/open.plugins/impl/browser.plugin" ], function(BravaPlugin, BrowserPlugin) {
  "use strict";
  return [ {
    sequence: 200,
    plugin: BravaPlugin,
    decides: BravaPlugin.isSupported
  }, {
    sequence: 600,
    plugin: BrowserPlugin,
    decides: BrowserPlugin.isSupported
  } ];
});