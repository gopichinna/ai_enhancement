/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/perspective/perspective.model", "csui/models/mixins/connectable/connectable.mixin", "csui/models/perspective/perspective.collection/perspective.collection.mixin" ], function(_, Backbone, PerspectiveModel, ConnectableMixin, PerspectiveCollectionMixin) {
  const PerspectiveCollection = Backbone.Collection.extend({
    model: PerspectiveModel,
    constructor: function PerspectiveCollection(options = {}, models) {
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(PerspectiveCollection.prototype);
  PerspectiveCollectionMixin.mixin(PerspectiveCollection.prototype);
  return PerspectiveCollection;
});