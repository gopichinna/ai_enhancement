/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/bulk.selection/bulk.selection.count.label.view" ], function(BulkSelectionCountLabelView) {
  "use strict";
  BulkSelectionCountLabelView.prototype.updateCounter = function() {
    const updatedCount = this.collection.length;
    this.ui?.selectedCountValue?.prop && this.ui?.selectedCountValue?.prop("value", updatedCount.toString());
    if (updatedCount === 0) {
      this.el?.classList?.add("binf-hidden");
      return;
    }
    this.el?.classList?.contains("binf-hidden") && this.el?.classList?.remove("binf-hidden");
  };
});