/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/favorites.factory", "d2/widgets/favoritestable/toolbaritems", "csui/widgets/nodestable/toolbaritems", "d2/widgets/widgettable/widgettable.view", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "i18n!d2/widgets/checkedouttable/impl/nls/lang" ], function(module, $, _, Backbone, Marionette, FavoriteCollectionFactory, toolbarItems, nodesTableToolbarItems, D2WidgetTable, widgetConstants, constants, serverQueryUtils, lang) {
  "use strict";
  var FavoritesTableView = D2WidgetTable.extend({
    events: {
      "favorite:change": "onFavoriteChange"
    },
    constructor: function FavoritesTableView(options) {
      options.d2collectionFactory = FavoriteCollectionFactory;
      options.toolbarItems = toolbarItems;
      D2WidgetTable.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      D2WidgetTable.prototype.initialize.apply(this, arguments);
      this._addFavoriteAttribute(this.collection);
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.FAVORITES, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.dialogTitle;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.FAVORITE;
    },
    onFavoriteChange: function(event, favModel) {
      this._favoritesChanged = true;
      this.removeNodesFromSelection(favModel);
    },
    _addFavoriteAttribute: function(collection) {
      collection.each(function(node) {
        node.set("favorite", true);
      }, this);
      return true;
    }
  });
  return FavoritesTableView;
});