/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "nuc/models/node/node.model", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, NodeModel, constants, lang) {
  "use strict";
  const AddAssignments = CommandModel.extend({
    defaults: {
      signature: "Aviator-AddAssignment",
      command_key: "Aviator-AddAssignment",
      name: lang.CommandAviatorAddAssignment,
      scope: "single"
    },
    enabled: function(status) {
      return !status.nodes || !status.nodes.length;
    },
    execute: function(status) {
      var containerNode = new NodeModel(undefined, {
        context: status.context,
        connector: status.collection.connector
      }), selectedValues = status.collection.allModels.map(model => model.get("id"));
      this.displayContentAssist(status, containerNode, selectedValues).done(models => status.collection.addNodeModels(models));
      return $.Deferred().resolve().promise();
    },
    displayContentAssist: function(status, container, selectedValues) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var pickerOptions = {
          dialogTitle: lang.AviatorContentAssistTitle,
          connector: status.collection.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: true,
          globalSearch: false,
          includeFavorites: false,
          includeRelatedFiles: false,
          subTypeFilters: [ "dm_folder" ],
          locationSelector: false,
          selectType: "typeName",
          selectTypeValue: constants.Types.FOLDER
        };
        pickerOptions.disabledNodeIds = selectedValues || [];
        pickerOptions.disabledSelectionState = true;
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.AVIATOR_ASSIGNMENT_ADD + constants.StorageKey.ANCESTOR_INFO;
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        var nodePicker = new NodePicker(pickerOptions);
        nodePicker.show().done(function(selectedNodes) {
          deferred.resolve(selectedNodes.nodes);
        }).fail(function() {
          deferred.reject("close");
        });
      }, deferred.reject);
      return deferred.promise();
    }
  });
  return AddAssignments;
});