/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/name/name.view", "csui/controls/table/cells/cell.registry" ], function(NameCellView, cellViewRegistry) {
  var FavoriteNameCellView = NameCellView.extend({});
  cellViewRegistry.registerByColumnKey("favorite_name", FavoriteNameCellView);
  return FavoriteNameCellView;
});