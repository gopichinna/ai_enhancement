/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "d2/server.adaptors/models/widget/search.results/search.results.mixin", "nuc/models/node/node.model", "nuc/models/browsable/browsable.mixin", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin" ], function(module, _, Backbone, SearchServerAdaptorMixin, NodeModel, BrowsableMixin, ConnectableMixin, FetchableMixin, AdditionalResourcesV2Mixin, DelayedCommandableV2Mixin) {
  var SearchBoxModel = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function SearchBoxModel(attributes, options) {
      SearchBoxModel.__super__.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeAdditionalResourcesV2Mixin(options).makeBrowsable(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
    },
    toJSON: function() {
      return SearchBoxModel.__super__.toJSON.apply(this, arguments);
    }
  });
  BrowsableMixin.mixin(SearchBoxModel.prototype);
  ConnectableMixin.mixin(SearchBoxModel.prototype);
  FetchableMixin.mixin(SearchBoxModel.prototype);
  AdditionalResourcesV2Mixin.mixin(SearchBoxModel.prototype);
  SearchServerAdaptorMixin.mixin(SearchBoxModel.prototype);
  DelayedCommandableV2Mixin.mixin(SearchBoxModel.prototype);
  return SearchBoxModel;
});