/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import TabableRegionBehavior from "csui/behaviors/keyboard.navigation/tabable.region.behavior";

const origSetInitialTabIndex = TabableRegionBehavior.prototype.setInitialTabIndex;

TabableRegionBehavior.prototype.setInitialTabIndex = function() {
  if (!this.currentlyFocusedElement && this.view.isTabable()) {
    let currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
    currentlyFocusedElement?.off("focus." + this.view.cid);
  }
  return origSetInitialTabIndex.apply(this, arguments);
};