/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/models/workflow/workflows", "csui/utils/commands", "nuc/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, WorkflowCollection, commands) {
  "use strict";
  return CollectionFactory.extend({
    propertyPrefix: "workflows",
    constructor: function WorkflowCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var workflows = this.options.widget || this.options.workflows || {};
      if (!(workflows instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        workflows = new WorkflowCollection(workflows.models, _.extend({
          context: context,
          connector: connector,
          workflowsReportingType: options?.attributes?.workflowsReportingType,
          widgetType: options.widgetType
        }, workflows.options, config.options, WorkflowCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = workflows;
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