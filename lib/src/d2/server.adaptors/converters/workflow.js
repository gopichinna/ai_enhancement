/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/constants", "i18n!d2/server.adaptors/nls/lang" ], function(_, constants, lang) {
  "use strict";
  var clientServerAttrNameMap = {
    id: "r_object_id",
    name: "object_name",
    d2_workflow_due_date: "due_date",
    d2_workflow_state: "wf_state"
  }, serverClientAttrNameMap = {}, d2WorkflowState = {
    SCHEDULED: 0,
    RUNNING: 1,
    PAUSED: 2,
    ABORTED: 3,
    FINISHED: 4
  };
  _.map(clientServerAttrNameMap, function(value, key) {
    serverClientAttrNameMap[value] = key;
  });
  return {
    convertWorkflow: function(entry) {
      var attributes = entry.properties || entry, actions = attributes.actions || [], favorite = entry["favorite"] ? entry["favorite"].favorite : undefined, properties = {
        links: entry.links,
        actions: actions,
        favorite: favorite
      };
      var unmappedAttributes = _.omit(attributes, _.keys(this.getServerClientAttrNameMap()));
      _.extend(properties, unmappedAttributes);
      var map = this.getClientServerAttrNameMap();
      _.map(map, function(value, key) {
        properties[key] = attributes[value];
      });
      if (properties["d2_workflow_state"]) {
        properties["r_runtime_state"] = d2WorkflowState[properties["d2_workflow_state"].toUpperCase()];
      }
      properties.type = constants.Types.WORKFLOW;
      properties.type_name = lang.nodeTypeWorkflow;
      properties.customProperties = true;
      return properties;
    },
    getClientServerAttrNameMap: function() {
      return clientServerAttrNameMap;
    },
    getServerClientAttrNameMap: function() {
      return serverClientAttrNameMap;
    }
  };
});