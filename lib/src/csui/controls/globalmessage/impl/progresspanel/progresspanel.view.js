/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/progresspanel/progresspanel.view" ], function(_, SmartProgressPanelView) {
  var ProgressPanelView = SmartProgressPanelView.extend({
    constructor: function ProgressPanelView(options) {
      SmartProgressPanelView.prototype.constructor.call(this, options);
    }
  });
  return ProgressPanelView;
});