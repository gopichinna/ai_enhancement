/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "i18n!d2/dialogs/target.browse/start.locations/impl/nls/lang", "d2/server.adaptors/models/widget/favorites/favorites.model", "dctmw/utils/rest.resources", "d2/utils/widget.constants" ], function(_, $, LocationBaseFactory, lang, FavoriteCollection, RestResources, widgetConstants) {
  "use strict";
  var FavoritesFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        name: lang.labelFavorites,
        icon: "favorites"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var favModel = {}, container = this.options.container, defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defFav = defaultWidgets[widgetConstants.DEFAULT.FAVORITES], widgetName = defFav ? defFav : undefined, widgetType = defFav ? widgetConstants.D2.FAVORITES : undefined;
      if (!widgetName || !widgetType) {
        throw Error(lang.errMsg);
      }
      var favorites = new FavoriteCollection(favModel.models, _.extend({
        connector: options.connector,
        query: options.query
      }, {
        autofetch: true,
        autoreset: true,
        expanded: true,
        top: options.pageSize,
        widgetName: widgetName,
        widgetType: widgetType,
        subTypeFilters: options.subTypeFilters,
        excludeTypes: options.excludeTypes
      }));
      if (container) {
        container.set("unselectable", false);
      }
      return {
        container: container,
        collection: favorites
      };
    }
  });
  return FavoritesFactory;
});