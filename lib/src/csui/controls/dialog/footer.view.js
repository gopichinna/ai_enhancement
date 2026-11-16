/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/dialog/footer.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function(SmartDialogFooterView, TabableRegionBehavior) {
  var DialogFooterView = SmartDialogFooterView.extend({
    constructor: function DialogFooterView(options = {}) {
      options.footerTabableRegionBehavior = {
        behaviorClass: TabableRegionBehavior
      };
      SmartDialogFooterView.prototype.constructor.call(this, options);
    }
  });
  return DialogFooterView;
});