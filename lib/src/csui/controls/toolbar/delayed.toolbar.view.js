/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/toolbar/toolbar.view", "csui/controls/toolbar/toolbar.state.behavior" ], function(ToolbarView, ToolbarStateBehavior) {
  "use strict";
  var DelayedToolbarView = ToolbarView.extend({
    behaviors: {
      ToolbarState: {
        behaviorClass: ToolbarStateBehavior,
        delayedActions: function() {
          return this.options.delayedActions;
        }
      }
    },
    constructor: function DelayedToolbarView(options) {
      ToolbarView.prototype.constructor.apply(this, arguments);
    }
  });
  return DelayedToolbarView;
});