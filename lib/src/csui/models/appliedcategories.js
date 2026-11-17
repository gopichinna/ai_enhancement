/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "csui/models/mixins/node.resource/node.resource.mixin", "csui/models/appliedcategory", "csui/models/appliedcategories/server.adaptor.mixin" ], function(_, Backbone, Url, NodeResourceMixin, AppliedCategoryModel, ServerAdaptorMixin) {
  "use strict";
  var AppliedCategoryCollection = Backbone.Collection.extend({
    model: AppliedCategoryModel,
    constructor: function AppliedCategoryCollection(models, options) {
      options || {};
      this.sortInitially = !!options.sortInitially ? options.sortInitially : this.sortInitially;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options);
    },
    clone: function() {
      return new this.constructor(this.models, {
        node: this.node
      });
    }
  });
  NodeResourceMixin.mixin(AppliedCategoryCollection.prototype);
  ServerAdaptorMixin.mixin(AppliedCategoryCollection.prototype);
  return AppliedCategoryCollection;
});