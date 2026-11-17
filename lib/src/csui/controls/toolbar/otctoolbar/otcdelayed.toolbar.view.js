/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/toolbar/otctoolbar/otctoolbar.view", "csui/controls/toolbar/toolbar.state.behavior" ], function(OTCToolbarView, ToolbarStateBehavior) {
  "use strict";
  var OTCdelayedToolbarView = OTCToolbarView.extend({
    behaviors: {
      ToolbarState: {
        behaviorClass: ToolbarStateBehavior,
        delayedActions: function() {
          return this.options.delayedActions;
        }
      }
    },
    constructor: function DelayedToolbarView(options) {
      OTCToolbarView.prototype.constructor.apply(this, arguments);
    }
  });
  return OTCdelayedToolbarView;
});