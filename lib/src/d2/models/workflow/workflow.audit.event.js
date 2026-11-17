/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/models/node/node.model", "d2/utils/constants" ], function(_, NodeModel, constants) {
  "use strict";
  var WorkflowAuditEvent = NodeModel.extend({
    defaults: {
      type: constants.Types.WORKFLOW_EVENT
    },
    constructor: function WorkflowAuditEvent(attrs, options) {
      WorkflowAuditEvent.__super__.constructor.call(this, attrs, options);
    },
    parse: function(response) {
      response.properties = _.extend(response.properties || {}, {
        csuiDelayedActionsRetrieved: true
      });
      return response.properties;
    }
  });
  WorkflowAuditEvent.prototype.sync = function() {
    throw new Error("Syncing WorkflowAuditEvent model is not supported.");
  };
  return WorkflowAuditEvent;
});