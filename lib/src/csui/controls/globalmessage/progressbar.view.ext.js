/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/progressbar.view.ext" ], function(SmartProgressBarViewExt) {
  var ProgressBarViewExt = SmartProgressBarViewExt.extend({
    constructor: function ProgressBarViewExt(options) {
      SmartProgressBarViewExt.prototype.constructor.call(this, options);
    }
  });
  return ProgressBarViewExt;
});