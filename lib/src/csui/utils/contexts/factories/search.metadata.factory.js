/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/models/widget/search.results/search.metadata/search.metadata.model" ], function(module, _, Backbone, CollectionFactory, SearchMetadataModel) {
  var SearchMetadataModelFactory = CollectionFactory.extend({
    propertyPrefix: "searchMetadata",
    constructor: function SearchMetadataModelFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var metadata = this.options.metadata || {};
      if (!(metadata instanceof Backbone.Collection)) {
        var config = module.config();
        metadata = new SearchMetadataModel(metadata.models, _.extend({}, metadata.options, config.options));
      }
      this.property = metadata;
    },
    isFetchable: function() {
      return !!this.options;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return SearchMetadataModelFactory;
});