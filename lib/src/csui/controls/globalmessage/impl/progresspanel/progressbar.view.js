/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/progresspanel/progressbar.view" ], function(SmartProgressBarView) {
  var ProgressBarView = SmartProgressBarView.extend({
    constructor: function ProgressBarView(options) {
      SmartProgressBarView.prototype.constructor.call(this, options);
    }
  });
  return ProgressBarView;
});