/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commands", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/models/workflow/task" ], function(module, _, Backbone, commands, ModelFactory, ConnectorFactory, TaskModel) {
  "use strict";
  var TaskModelFactory = ModelFactory.extend({
    propertyPrefix: "task",
    constructor: function TaskModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var task = this.options.task || {};
      if (!(task instanceof Backbone.Model)) {
        var config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector,
          commands: commands.getAllSignatures(),
          fetchNotesCount: true,
          fetchSupportingDocumentsCount: true
        }, config.options, task.options);
        task = new TaskModel(task.attributes || config.attributes, creationOptions);
      }
      this.property = task;
    },
    isFetchable: function() {
      const propertyFetcahble = this.property.isFetchable();
      return this.options.permanent === true ? propertyFetcahble : this.property.fetched !== true && propertyFetcahble;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  TaskModelFactory.defaultModel = TaskModel;
  return TaskModelFactory;
});