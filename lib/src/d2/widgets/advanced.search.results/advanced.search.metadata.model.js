/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "d2/widgets/advanced.search.results/advanced.search.metadata.mixin" ], function($, _, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";
  var SearchMetadataItemModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var SearchMetadataItemsCollection = Backbone.Collection.extend({
    model: SearchMetadataItemModel,
    comparator: "sequence",
    constructor: function SearchMetadataItemsCollection(attributes, options) {
      SearchMetadataItemsCollection.__super__.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeServerAdaptor(options);
    },
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new SearchMetadataItemsCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  ConnectableMixin.mixin(SearchMetadataItemsCollection.prototype);
  FetchableMixin.mixin(SearchMetadataItemsCollection.prototype);
  ServerAdaptorMixin.mixin(SearchMetadataItemsCollection.prototype);
  return SearchMetadataItemsCollection;
});