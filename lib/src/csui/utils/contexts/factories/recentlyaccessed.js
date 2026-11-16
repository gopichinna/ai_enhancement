/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/widget/recentlyaccessed.model", "csui/utils/commands", "csui/utils/defaultactionitems", "csui/models/recentlyaccessed2/recentlyaccessed2.collection", "csui/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, RecentlyAccessedCollection, commands, defaultActionItems, RecentlyAccessed2Collection) {
  "use strict";
  var RecentlyAccessedCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "recentlyaccessed",
    constructor: function RecentlyAccessedCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var recentlyAccessed = this.options.recentlyaccessed || {};
      if (!(recentlyAccessed instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        var RACollection = config.useRecentlyAccessed2Collection ? RecentlyAccessed2Collection : RecentlyAccessedCollection;
        recentlyAccessed = new RACollection(recentlyAccessed.models, _.extend({
          connector: connector,
          recentlyAccessedSubtypes: config.recentlyAccessedSubtypes
        }, recentlyAccessed.options, config.options, RecentlyAccessedCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = recentlyAccessed;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function(includeMoreOptions) {
      var resourceScope = _.deepClone({
        fields: {
          properties: [],
          "versions.element(0)": []
        },
        stateEnabled: !!includeMoreOptions,
        includeResources: !!includeMoreOptions ? [ "metadata" ] : [],
        commands: !!includeMoreOptions ? commands.getAllSignatures() : []
      });
      return resourceScope;
    },
    getLimitedResourceScope: function() {
      var resourceScope = _.deepClone({
        fields: {
          properties: [ "container", "id", "name", "original_id", "type", "type_name", "parent_id", "reserved", "custom_view_search", "version_number", "image_url" ],
          "versions.element(0)": [ "mime_type" ]
        },
        includeResources: [],
        commands: defaultActionItems.getAllCommandSignatures(commands)
      });
      return resourceScope;
    },
    getInfiniteScrollFlag: function() {
      var config = module.config();
      return config.useRecentlyAccessed2Collection;
    }
  });
  return RecentlyAccessedCollectionFactory;
});