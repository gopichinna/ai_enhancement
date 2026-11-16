/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "csui/models/node/node.model", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/browsable/client-side.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/utils/contexts/factories/favorite2groups", "csui/utils/contexts/factories/favorites2", "csui/models/favorites2", "csui/dialogs/node.picker/data/node.picker.extra.data" ], function(_, Backbone, Url, NodeModel, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, FieldsV2Mixin, Favorite2GroupsCollectionFactory, Favorite2CollectionFactory, Favorite2Collection, extraData) {
  "use strict";
  var FavoriteCollection = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function FavoriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
      this.groupsCollection = options.context.getCollection(Favorite2GroupsCollectionFactory, {
        detached: true,
        permanent: true,
        favorites: {
          options: {
            promotedActionCommands: [],
            nonPromotedActionCommands: []
          }
        }
      });
      var limitedRS = Favorite2CollectionFactory.getLimitedResourceScope(), fieldsArray = Object.keys(extraData.getModelFields());
      for (let i = 0; i < fieldsArray?.length; i++) {
        let key = fieldsArray[i];
        !limitedRS?.fields?.hasOwnProperty(key) && (limitedRS.fields[key] = "");
      }
      this.groupsCollection.favorites.setResourceScope(limitedRS);
      this.childrenCollection = Favorite2Collection;
    },
    parse: function(response, options) {
      this.parseBrowsedState(response, options);
      return this.parseBrowsedItems(response, options);
    }
  });
  ClientSideBrowsableMixin.mixin(FavoriteCollection.prototype);
  BrowsableV2ResponseMixin.mixin(FavoriteCollection.prototype);
  ConnectableMixin.mixin(FavoriteCollection.prototype);
  FetchableMixin.mixin(FavoriteCollection.prototype);
  FieldsV2Mixin.mixin(FavoriteCollection.prototype);
  return FavoriteCollection;
});