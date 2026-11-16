/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/widgets/savedsearch/savedsearch.factory", "d2/widgets/savedsearch/savedsearch.groups.model", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, SavedSearchCollectionFactory, SavedSearchGroupsCollection) {
  "use strict";
  var SavedSearchGroupsCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "savedSearchGroup",
    constructor: function SavedSearchGroupsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var savedSearchGroups = this.options.savedSearchGroups || {};
      if (!(savedSearchGroups instanceof Backbone.Collection)) {
        var config = module.config();
        var connector = context.getObject(ConnectorFactory, options);
        var savedsearches = context.getCollection(SavedSearchCollectionFactory, options);
        savedSearchGroups = new SavedSearchGroupsCollection(savedSearchGroups.models, _.extend({
          savedsearches: savedsearches,
          connector: connector,
          autoreset: true
        }, savedSearchGroups.options, config.options));
      }
      this.property = savedSearchGroups;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return SavedSearchGroupsCollectionFactory;
});