/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/backbone", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands/properties", "nuc/models/nodes", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function(require, Backbone, _, $, PropertiesCommand, NodeCollection, CommandHelper, lang) {
  "use strict";
  var OpenRelationsCommand = PropertiesCommand.extend({
    defaults: {
      signature: "D2-OpenRelations",
      command_key: "D2-OpenRelations",
      name: lang.CommandNameOpenRelations,
      scope: "single",
      commands: "d2/widgets/metadata/panels/relations/metadata.relations.command"
    },
    execute: function(status, options) {
      var node = CommandHelper.getJustOneNode(status), deferred = $.Deferred(), containerNode = node.collection && node.collection.node;
      if (status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "taskdetails" || status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "myworkflowdetails" || status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "allworkflowdetails") {
        require([ "csui/utils/commands" ], function(commands) {
          var openFilesCommand = status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "taskdetails" ? commands.get("D2-OpenTaskFiles") : commands.get("D2-OpenWorkflowFiles");
          if (openFilesCommand) {
            openFilesCommand.execute(_.defaults(options, status)).done(deferred.resolve).fail(deferred.reject);
          }
        }, deferred.reject);
        return deferred.promise();
      } else if (status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER) === "Metadata" || status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "taskdocuments" || status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "myworkflowdocuments" || status.context.viewStateModel.get(status.context.viewStateModel.CONSTANTS.CURRENT_ROUTER_SCOPE_ID) === "allworkflowdocuments") {
        status.context.viewStateModel.set(status.context.viewStateModel.CONSTANTS.STATE, {
          dropdown: "relations"
        });
        return deferred.resolve().promise();
      } else {
        this.commandStatus = {
          collection: node.collection,
          container: containerNode && containerNode.get("container") === true ? containerNode : null,
          context: status.context,
          nodes: new NodeCollection([ node ]),
          selectedTab: new Backbone.Model({
            name: "relations"
          }),
          suppressSuccessMessage: true,
          suppressFailMessage: true,
          originatingView: status.originatingView
        };
        return this._executeWithSaveState(this.commandStatus, options);
      }
    }
  });
  return OpenRelationsCommand;
});