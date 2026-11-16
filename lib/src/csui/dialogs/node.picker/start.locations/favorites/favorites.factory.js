/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/dialogs/node.picker/start.locations/location.base.factory", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang", "csui/dialogs/node.picker/start.locations/favorites/impl/favorite.collection" ], function(_, $, LocationBaseFactory, lang, FavoriteCollection) {
  "use strict";
  var FavoritesFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        name: lang.labelFavorites,
        icon: "favorites"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options = {}) {
      var favorites = new FavoriteCollection(undefined, {
        connector: this.options.connector,
        autoreset: true,
        expand: [ "node" ],
        ...options
      });
      return {
        container: null,
        collection: favorites.groupsCollection,
        locationName: lang.labelFavorites,
        groupsLocationName: "favorites",
        nameAttribute: "favorite_name",
        isTreeView: true,
        groupsCollection: favorites.groupsCollection,
        groupChildrenCollection: favorites.childrenCollection,
        expandOnSearch: true,
        groupIconName: "smart_mime_fav_group32"
      };
    }
  });
  return FavoritesFactory;
});