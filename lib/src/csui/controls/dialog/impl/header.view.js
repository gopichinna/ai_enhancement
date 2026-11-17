/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/dialog/header.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function(SmartDialogHeaderView, TabableRegionBehavior) {
  var DialogHeaderView = SmartDialogHeaderView.extend({
    constructor: function DialogHeaderView(options) {
      options.headerTabableRegionBehavior = {
        behaviorClass: TabableRegionBehavior
      };
      SmartDialogHeaderView.prototype.constructor.call(this, options);
    }
  });
  return DialogHeaderView;
});