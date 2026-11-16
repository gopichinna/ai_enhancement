/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/favorite2groups", "csui/models/favorite2columns", "csui/utils/contexts/factories/favorites2", "csui/models/favorites2", "csui/utils/contexts/factories/recentlyaccessed" ], function(module, $, _, Backbone, ConnectorFactory, Favorite2GroupsCollectionFactory, Favorite2ColumnCollection, Favorite2CollectionFactory, Favorite2Collection, RecentlyAccessedCollectionFactory) {
  return {
    getCollectionFromObject: function(dataObject, context) {
      if (dataObject.module_name === "favorites") {
        return this.getGroupFavoritesCollection(dataObject, context);
      } else if (dataObject.module_name === "recently_accessed") {
        return this.getRecentlyAccessedCollection(dataObject, context);
      }
      return deferred.promise();
    },
    getGroupFavoritesCollection: function(dataObject, context) {
      const deferred = $.Deferred(), collection = new Favorite2Collection(undefined, {}), groups = context.getCollection(Favorite2GroupsCollectionFactory);
      groups.favorites.setResourceScope(Favorite2CollectionFactory.getDefaultsOnlyResourceScope());
      groups.favorites.setEnabledDelayRestCommands(false);
      groups.listenTo(groups, "sync", function() {
        const selectedGroup = groups.find({
          tab_id: dataObject.tab_id
        });
        if (selectedGroup) {
          collection.populate(selectedGroup.favorites.models, {
            parse: false
          });
          return deferred.resolve(collection);
        }
        deferred.reject();
      });
      groups.listenTo(groups, "error", function(error) {
        deferred.reject(error);
      });
      groups.ensureFetched({
        reload: true
      });
      return deferred.promise();
    },
    getRecentlyAccessedCollection: function(dataObject, context) {
      const deferred = $.Deferred(), collection = context.getCollection(RecentlyAccessedCollectionFactory);
      collection.setEnabledDelayRestCommands(false);
      collection.setOrder(dataObject.orderBy, false);
      collection.listenTo(collection, "sync", function() {
        deferred.resolve(collection);
      });
      collection.listenTo(collection, "error", function(error) {
        deferred.reject(error);
      });
      collection.ensureFetched({
        reload: true
      });
      return deferred.promise();
    }
  };
});