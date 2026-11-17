/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/perspective/personalization.model", "csui/models/mixins/connectable/connectable.mixin", "csui/models/perspective/personalize/personalization.collection.mixin" ], function(Backbone, PersonalizationModel, ConnectableMixin, PersonalizationCollectionMixin) {
  const PersonalizationCollection = Backbone.Collection.extend({
    model: PersonalizationModel,
    constructor: function PersonalizationCollection(options = {}) {
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, [], options);
      this.makeConnectable(options).makeServerAdaptor(options);
    }
  });
  ConnectableMixin.mixin(PersonalizationCollection.prototype);
  PersonalizationCollectionMixin.mixin(PersonalizationCollection.prototype);
  return PersonalizationCollection;
});