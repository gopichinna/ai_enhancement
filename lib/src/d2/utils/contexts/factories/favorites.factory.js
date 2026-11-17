/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/server.adaptors/models/widget/favorites/favorites.model", "csui/utils/commands", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, FavoritesCollection, commands) {
  "use strict";
  var D2FavoriteCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "d2favorites",
    constructor: function D2FavoriteCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var favorites = this.options.favorites || this.options.widget || {};
      if (!(favorites instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        favorites = new FavoritesCollection(favorites.models, _.extend({
          connector: connector
        }, favorites.options, config.options, D2FavoriteCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = favorites;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function() {
      return _.deepClone({
        fields: {
          properties: [],
          "versions.element(0)": []
        },
        includeResources: [ "metadata" ],
        commands: commands.getAllSignatures()
      });
    }
  });
  return D2FavoriteCollectionFactory;
});