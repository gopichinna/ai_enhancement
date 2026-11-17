/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/facets", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/browsable/v1.request.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/widget/recycle.items/facet.server.adaptor.mixin", "csui/utils/deepClone/deepClone" ], function(_, FacetCollection, ConnectableMixin, FetchableMixin, BrowsableV1RequestMixin, BrowsableV2ResponseMixin, ServerAdaptorMixin) {
  "use strict";
  var RecycleItemsFacetCollection = FacetCollection.extend({
    constructor: function RecycleItemsFacetCollection(models, options) {
      this.options = options || (options = {});
      FacetCollection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeBrowsableV1Request(options).makeBrowsableV2Response(options).makeServerAdaptor(options);
    },
    clone: function() {
      return new this.constructor(this.models, {
        connector: this.connector,
        skip: this.skipCount,
        top: this.topCount,
        filters: _.deepClone(this.filters)
      });
    },
    fetch: function() {
      let facets = this._setFacets();
      this._parseFacets(facets);
      return;
    },
    isFetchable: function() {
      return true;
    }
  });
  BrowsableV1RequestMixin.mixin(RecycleItemsFacetCollection.prototype);
  BrowsableV2ResponseMixin.mixin(RecycleItemsFacetCollection.prototype);
  ConnectableMixin.mixin(RecycleItemsFacetCollection.prototype);
  FetchableMixin.mixin(RecycleItemsFacetCollection.prototype);
  ServerAdaptorMixin.mixin(RecycleItemsFacetCollection.prototype);
  return RecycleItemsFacetCollection;
});