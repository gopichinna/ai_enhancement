/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/node/node.model", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/browsable.mixin", "nuc/models/browsable/v1.request.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/utils/deepClone/deepClone" ], function(_, $, Backbone, Url, NodeModel, ConnectableMixin, FetchableMixin, BrowsableMixin, BrowsableV1RequestMixin, BrowsableV2ResponseMixin) {
  "use strict";
  var SearchResultCollection = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function SearchResultCollection(models, options) {
      this.options = options || (options = {});
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options).makeFetchable(options).makeBrowsable(options).makeBrowsableV1Request(options).makeBrowsableV2Response(options);
    },
    clone: function() {
      return new this.constructor(this.models, {
        connector: this.connector,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: _.clone(this.orderBy)
      });
    }
  });
  BrowsableMixin.mixin(SearchResultCollection.prototype);
  BrowsableV1RequestMixin.mixin(SearchResultCollection.prototype);
  BrowsableV2ResponseMixin.mixin(SearchResultCollection.prototype);
  ConnectableMixin.mixin(SearchResultCollection.prototype);
  FetchableMixin.mixin(SearchResultCollection.prototype);
  _.extend(SearchResultCollection.prototype, {
    isFetchable: function() {
      return !!this.options.query.get("where");
    },
    cacheId: "",
    url: function() {
      var url = this.connector.connection.url.replace("/v1", "/v2"), query = this.options.query.toJSON();
      query.where = "OTName:" + query.where;
      this.orderBy = "OTName";
      query = Url.combineQueryString(this.getBrowsableUrlQuery(), {
        actions: "open",
        expand: "properties{parent_id}"
      }, query);
      return Url.combine(url, "search?" + query);
    },
    parse: function(response, options) {
      this.parseBrowsedState(response.collection, options);
      response.results.sorting = response.collection.sorting;
      this.cacheId = !!response.collection && !!response.collection.searching && !!response.collection.searching.cache_id ? response.collection.searching.cache_id : "";
      return this.parseBrowsedItems(response, options);
    }
  });
  return SearchResultCollection;
});