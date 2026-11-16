/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/table/cells/parent/parent.view", "d2/utils/constants" ], function(_, ParentCellView, constants) {
  "use strict";
  var proto = ParentCellView.prototype;
  proto.renderValue = function() {
    var inactive = false, parentLocation;
    let inactiveTypes = [ constants.Types.WORKFLOW_STEP ];
    if (_.contains(inactiveTypes, this.model.get("type"))) {
      inactive = true;
    }
    this.parentIconView.options.inactive = inactive;
    if (Object.keys(this.parentModel.attributes).length) {
      this.contentRegion.show(this.parentIconView);
    }
    parentLocation = this.$el.find(".csui-parent-location");
    parentLocation?.append('<div class="csui-table-cell-name-appendix"></div>');
  };
});