/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/context.plugin" ], function(ContextPlugin) {
  "use strict";
  var PerspectiveContextPlugin = ContextPlugin.extend({
    onCreate: function() {},
    onApply: function() {},
    onClear: function() {},
    onRefresh: function() {}
  });
  return PerspectiveContextPlugin;
});