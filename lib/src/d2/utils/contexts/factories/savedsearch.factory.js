/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commands", "csui/utils/contexts/factories/factory", "d2/models/savedsearch/savedsearches" ], function(module, _, Backbone, commands, CollectionFactory, SavedSearchesCollection) {
  "use strict";
  var SavedSearchGroupsCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "savedSearchCollection",
    constructor: function SavedSearchGroupsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var savedsearch = this.options.savedsearch || {};
      var savedSearchCollection = new SavedSearchesCollection(savedsearch.models, _.extend({
        node: options.node,
        autoreset: true
      }, SavedSearchGroupsCollectionFactory.getDefaultResourceScope()));
      this.property = savedSearchCollection;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function() {
      return _.deepClone({
        commands: commands.getAllSignatures()
      });
    }
  });
  return SavedSearchGroupsCollectionFactory;
});