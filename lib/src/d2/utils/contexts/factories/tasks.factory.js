/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/models/workflow/tasks", "csui/utils/commands", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, TaskCollection, commands) {
  "use strict";
  return CollectionFactory.extend({
    propertyPrefix: "tasks",
    constructor: function TaskCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var tasks = this.options.widget || this.options.tasks || {};
      if (!(tasks instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        tasks = new TaskCollection(tasks.models, _.extend({
          connector: connector
        }, tasks.options, config.options, TaskCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = tasks;
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