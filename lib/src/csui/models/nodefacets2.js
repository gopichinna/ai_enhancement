/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/facets", "csui/models/mixins/node.resource/node.resource.mixin", "csui/models/node.facets2/server.adaptor.mixin", "csui/utils/deepClone/deepClone" ], function(_, FacetCollection, NodeResourceMixin, ServerAdaptorMixin) {
  "use strict";
  var NodeFacet2Collection = FacetCollection.extend({
    constructor: function NodeFacet2Collection(models, options) {
      FacetCollection.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options).makeServerAdaptor(options);
    },
    isFetchable: function() {
      return this.areFacetsFetchable(this);
    },
    clone: function() {
      return new this.constructor(this.models, {
        node: this.node,
        itemsToShow: this.itemsToShow,
        facetIds: this.facetIds,
        filters: _.deepClone(this.filters)
      });
    }
  });
  NodeResourceMixin.mixin(NodeFacet2Collection.prototype);
  ServerAdaptorMixin.mixin(NodeFacet2Collection.prototype);
  return NodeFacet2Collection;
});