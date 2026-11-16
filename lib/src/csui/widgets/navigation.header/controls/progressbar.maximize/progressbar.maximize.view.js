/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/progressbar.maximize/progressbar.maximize.view" ], function(SmartProgressbarMaximizeView) {
  var ProgressbarMaximizeView = SmartProgressbarMaximizeView.extend({
    constructor: function ProgressbarMaximizeView(options) {
      SmartProgressbarMaximizeView.prototype.constructor.call(this, options);
    }
  });
  return ProgressbarMaximizeView;
});