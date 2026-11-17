/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url", "csui/models/node/node.model", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/browsable/browsable.mixin", "csui/models/browsable/v1.request.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/utils/deepClone/deepClone" ], function(_, $, Backbone, Url, NodeModel, ConnectableMixin, FetchableMixin, BrowsableMixin, BrowsableV1RequestMixin, BrowsableV2ResponseMixin, FieldsV2Mixin) {
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
      return true;
    },
    cacheId: "",
    url: function() {
      var url = this.connector.getConnectionUrl().getApiBase("v2"), fields = _.union(this.getResourceFieldsUrlQuery().fields, [ "properties", "versions.element(0)" ]), query = this.options.query.toJSON();
      query.where = "OTName:" + query.where;
      this.orderBy = "OTName";
      if (this.filters && this.filters.type) {
        query.where += ' AND "OTSubType": in ( ' + this.filters.type.join(",") + " )";
      }
      query = Url.combineQueryString({
        fields: fields
      }, this.getBrowsableUrlQuery(), {
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
  FieldsV2Mixin.mixin(SearchResultCollection.prototype);
  return SearchResultCollection;
});