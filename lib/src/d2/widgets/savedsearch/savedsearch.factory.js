/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/widgets/savedsearch/savedsearch.model", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, SavedSearchCollection) {
  "use strict";
  var SavedSearchCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "savedSearch",
    constructor: function SavedSearchCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var savedsearch = this.options.savedsearch || {};
      if (!(savedsearch instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options);
        var config = module.config();
        savedsearch = new SavedSearchCollection(savedsearch.models, _.extend({
          connector: connector,
          autoreset: true
        }, savedsearch.options, config.options));
      }
      this.property = savedsearch;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return SavedSearchCollectionFactory;
});