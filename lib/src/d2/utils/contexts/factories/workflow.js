/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commands", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/models/workflow/workflow" ], function(module, _, Backbone, commands, ModelFactory, ConnectorFactory, WorkflowModel) {
  "use strict";
  var WorkflowModelFactory = ModelFactory.extend({
    propertyPrefix: "workflow",
    constructor: function WorkflowModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var workflow = this.options.workflow || {};
      if (!(workflow instanceof Backbone.Model)) {
        var config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector,
          commands: commands.getAllSignatures(),
          fetchNotesCount: true,
          fetchSupportingDocumentsCount: true
        }, config.options, workflow.options);
        workflow = new WorkflowModel(workflow.attributes || config.attributes, creationOptions);
      }
      this.property = workflow;
    },
    isFetchable: function() {
      const propertyFetcahble = this.property.isFetchable();
      return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  WorkflowModelFactory.defaultModel = WorkflowModel;
  return WorkflowModelFactory;
});