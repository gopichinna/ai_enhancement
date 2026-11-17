/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/themes/theming", "csui/controls/tableactionbar/tableactionbar.view", "d2/overrides/csui/controls/toolbar/otctoolbar/otctoolitem.view", "d2/utils/constants", "d2/utils/widget.constants" ], function(theming, TableActionBarView, D2OTCToolItemView, constants, widgetConstants) {
  "use strict";
  var originalGetChildView = TableActionBarView.prototype.getChildView, originalRenderLazyActions = TableActionBarView.prototype._renderLazyActions;
  TableActionBarView.prototype.getChildView = function(item) {
    let childView = originalGetChildView.apply(this, arguments), itemIndex = this.collection.models.indexOf(item), flag = !(!theming.isJATOTheme() && !item.get("iconName") && item.get("icon") && itemIndex < this.options.maxItemsShown) && !item.get("flyout");
    if (flag) {
      return D2OTCToolItemView;
    }
    return childView;
  };
  TableActionBarView.prototype._renderLazyActions = function() {
    if ((this.model.get("bws_ids") || this.model.widgetType === widgetConstants.D2.BWS) && !this.model.get("id").startsWith("81")) {
      this.model.nonPromotedActionsOptions.menuType = constants.MenuTypes.BWS_ITEMS;
    }
    return originalRenderLazyActions.apply(this, arguments);
  };
});