/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "d2/models/workflow/workflow.summary.collection", "d2/models/workflow/admin.workflow.summary.collection" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, WFSummaryCollection, AdminWFSummaryCollection) {
  "use strict";
  var AdminWFSummaryFactory = CollectionFactory.extend({
    propertyPrefix: "adminWfSummary",
    constructor: function WFSummaryFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var wfsummary = this.options.wfsummary || {};
      if (!(wfsummary instanceof Backbone.Collection)) {
        var config = module.config(), connector = context.getObject(ConnectorFactory, options), creationOptions = _.extend({
          connector: connector
        }, config.options, wfsummary.options, {
          autoreset: true
        });
        wfsummary = new AdminWFSummaryCollection(wfsummary.models, creationOptions);
      }
      this.property = wfsummary;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return AdminWFSummaryFactory;
});