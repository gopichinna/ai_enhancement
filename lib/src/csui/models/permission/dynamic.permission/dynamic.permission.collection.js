/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/v2.response.mixin", "csui/models/permission/dynamic.permission/dynamic.permission.model", "csui/models/permission/dynamic.permission/dynamic.permission.collection.mixin" ], function(Backbone, ConnectableMixin, FetchableMixin, BrowsableV2ResponseMixin, DynamicPermissionModel, ServerAdaptorMixin) {
  "use strict";
  let DynamicPermissionCollection = Backbone.Collection.extend({
    model: DynamicPermissionModel,
    constructor: function DynamicPermissionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options = options;
      this.makeConnectable(options).makeFetchable(options).makeBrowsableV2Response(options);
    },
    isFetchable: function() {
      return true;
    }
  });
  FetchableMixin.mixin(DynamicPermissionCollection.prototype);
  BrowsableV2ResponseMixin.mixin(DynamicPermissionCollection.prototype);
  ConnectableMixin.mixin(DynamicPermissionCollection.prototype);
  ServerAdaptorMixin.mixin(DynamicPermissionCollection.prototype);
  return DynamicPermissionCollection;
});