/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "d2/models/workflow/workflow.templates.collection" ], function(_, $, LocationBaseFactory, WorkflowTemplatesCollection) {
  "use strict";
  var WorkflowTemplatesFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        hide: true,
        invalid: false
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var workflowTemplatesModel = {}, container = this.options.container;
      var workflowTemplates = new WorkflowTemplatesCollection(workflowTemplatesModel.models, _.extend({
        connector: options.connector,
        query: options.query
      }, {
        autofetch: true,
        autoreset: true,
        widgetName: options.widgetName
      }));
      if (container) {
        container.set("unselectable", false);
      }
      return {
        container: container,
        collection: workflowTemplates
      };
    }
  });
  return WorkflowTemplatesFactory;
});