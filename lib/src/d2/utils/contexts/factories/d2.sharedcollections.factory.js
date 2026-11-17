/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/utils/commands", "d2/models/d2collections/d2.sharedcollections.collection" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, commands, SharedCollectionWidgetCollection) {
  "use strict";
  var SharedCollectionsWidgetFactory = CollectionFactory.extend({
    propertyPrefix: "SharedCollectionWidgetCol",
    constructor: function SharedCollectionsWidgetFactory(context, options) {
      SharedCollectionsWidgetFactory.__super__.constructor.call(this, context, options);
      var SharedCollectionWidgetCol = this.options.widget || this.options.SharedCollectionWidgetCol || {};
      if (!(SharedCollectionWidgetCol instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        SharedCollectionWidgetCol = new SharedCollectionWidgetCollection(SharedCollectionWidgetCol.models, _.extend({
          connector: connector
        }, SharedCollectionWidgetCol.options, config.options, SharedCollectionsWidgetFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = SharedCollectionWidgetCol;
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
  return SharedCollectionsWidgetFactory;
});