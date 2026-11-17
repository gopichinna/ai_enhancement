/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/utils/commands", "d2/models/d2collections/d2.mycollections.collection" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, commands, MyCollectionWidgetCollection) {
  "use strict";
  return CollectionFactory.extend({
    propertyPrefix: "CollectionWidgetCol",
    constructor: function MyCollectionsWidgetFactory(context, options) {
      MyCollectionsWidgetFactory.__super__.constructor.call(this, context, options);
      var CollectionWidgetCol = this.options.widget || this.options.CollectionWidgetCol || {};
      if (!(CollectionWidgetCol instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        CollectionWidgetCol = new MyCollectionWidgetCollection(CollectionWidgetCol.models, _.extend({
          connector: connector
        }, CollectionWidgetCol.options, config.options, MyCollectionsWidgetFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = CollectionWidgetCol;
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
});