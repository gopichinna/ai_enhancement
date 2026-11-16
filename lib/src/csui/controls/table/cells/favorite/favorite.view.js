/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/table/cells/cell/cell.view", "csui/controls/table/cells/cell.registry", "csui/widgets/favorites/favorite.star.view", "csui/utils/high.contrast/detector!", "css!csui/controls/table/cells/favorite/impl/favorite" ], function(_, CellView, cellViewRegistry, FavoriteStarView, highContrast) {
  var FavoriteStarCellView = CellView.extend({
    constructor: function FavoriteStarCellView(options) {
      CellView.prototype.constructor.apply(this, arguments);
    },
    onBeforeDestroy: function() {
      this.triggerMethod("close:add:favorite:form");
      if (this.favStarView) {
        this.favStarView.destroy();
        this.favStarView = undefined;
      }
    },
    renderValue: function() {
      if (!this.favStarView) {
        this.favStarView = new FavoriteStarView(_.extend({
          checkVisible: true,
          popoverAtBodyElement: true,
          focusable: false,
          blockingParentView: this.options.tableView,
          useIconsForDarkBackground: highContrast === 1
        }, this.options));
      }
      this.listenTo(this.favStarView, "show:add:favorite:form", function() {
        this.triggerMethod("show:add:favorite:form");
      });
      this.listenTo(this.favStarView, "close:add:favorite:form", function() {
        this.triggerMethod("close:add:favorite:form");
      });
      this.favStarView.render();
      this.$el.append(this.favStarView.el);
      this.listenTo(this.options.tableView, "scroll", function() {
        this.favStarView && this.favStarView.closePopover();
      });
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "csui-table-cell-favorite"
  });
  cellViewRegistry.registerByColumnKey("favorite", FavoriteStarCellView);
  return FavoriteStarCellView;
});