/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/constants", "i18n!d2/server.adaptors/nls/lang" ], function(_, constants, lang) {
  "use strict";
  var clientServerAttrNameMap = {
    id: "r_object_id",
    name: "task_subject",
    d2_task_due_date: "due_date",
    d2_task_priority: "priority"
  }, serverClientAttrNameMap = {};
  _.map(clientServerAttrNameMap, function(value, key) {
    serverClientAttrNameMap[value] = key;
  });
  return {
    convertTask: function(entry) {
      var attributes = entry.properties || entry, actions = attributes.actions || [], properties = {
        links: entry.links,
        actions: actions,
        wf_working_documents_count: entry.wf_working_documents_count,
        wf_supporting_documents_count: entry.wf_supporting_documents_count,
        wf_notes_count: entry.wf_notes_count,
        next_forward_activities: entry.next_forward_activities,
        next_reject_activities: entry.next_reject_activities,
        wf_sv_disable_notes: entry.wf_sv_disable_notes,
        wf_sv_disable_supporting_files: entry.wf_sv_disable_supporting_files,
        workflow_start_activity_package_type: entry.workflow_start_activity_package_type,
        is_delete_workflow_history_enabled: entry.is_delete_workflow_history_enabled,
        external_esign_off: entry["external-esign-off"],
        external_esign_message: entry["external-esign-off-confirmation-message"],
        packages: entry.packages
      };
      var unmappedAttributes = _.omit(attributes, _.keys(this.getServerClientAttrNameMap()));
      _.extend(properties, unmappedAttributes);
      var map = this.getClientServerAttrNameMap();
      _.map(map, function(value, key) {
        properties[key] = attributes[value];
      });
      properties.type = constants.Types.TASK;
      if (properties.task_state === "acquired") {
        properties.type_name = lang.nodeTypeAcquiredTask;
      } else if (properties.workflow_task_type === "DELEGATE") {
        properties.type_name = lang.nodeTypeDelegatedTask;
      } else if (properties.workflow_task_type === "REJECT") {
        properties.type_name = lang.nodeTypeRejectedTask;
      } else if (properties.is_read) {
        properties.type_name = lang.nodeTypeReadTask;
      } else {
        properties.type_name = lang.nodeTypeUnreadTask;
      }
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