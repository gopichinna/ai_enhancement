/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "csui/utils/base", "css!csui/controls/table/cells/versionnumber/impl/versionnumber" ], function(TemplatedCellView, cellViewRegistry, base) {
  "use strict";
  var VersionNumberCellView = TemplatedCellView.extend({
    className: "csui-nowrap",
    needsAriaLabel: true
  }, {
    hasFixedWidth: true,
    columnClassName: "csui-table-cell-version_number_name"
  });
  cellViewRegistry.registerByColumnKey("version_number_name", VersionNumberCellView);
  return VersionNumberCellView;
});