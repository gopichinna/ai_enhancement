/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/cell/cell.view", "csui/controls/table/cells/cell.registry", "css!csui/integration/permission/table/cells/impl/security.permission.cell" ], function(CellView, cellViewRegistry) {
  "use strict";
  var SecurityPermissionCellView = CellView.extend({
    renderValue: function() {
      var value = this.getValueText();
      if (value === "true") {
        this.$el.append('<span class="csui-icon icon-true icon-checkmark-green"></span>');
      } else if (value === "false") {
        this.$el.append('<span class="csui-icon icon-false circle_delete"></span>');
      } else {
        this.$el.text(value);
      }
    }
  }, {
    hasFixedWidth: true
  });
  cellViewRegistry.registerByColumnKey("security_clearance", SecurityPermissionCellView);
  cellViewRegistry.registerByColumnKey("supplemental_markings", SecurityPermissionCellView);
  return SecurityPermissionCellView;
});