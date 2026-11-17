/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/dialog/dialog.view", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/lib/binf/js/binf" ], function(SmartDialogView, TabablesBehavior, TabableRegionBehavior) {
  var DialogView = SmartDialogView.extend({
    constructor: function DialogView(options = {}) {
      if (!options.notabablesBehavior && !this.noTabablesBehavior) {
        this.tabablesBehavior = {
          behaviorClass: TabablesBehavior,
          recursiveNavigation: true,
          containTabFocus: true
        };
      }
      options.headerTabableRegionBehavior = {
        behaviorClass: TabableRegionBehavior
      };
      options.footerTabableRegionBehavior = {
        behaviorClass: TabableRegionBehavior
      };
      SmartDialogView.prototype.constructor.call(this, options);
    }
  });
  return DialogView;
});