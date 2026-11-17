/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "csui/utils/commands/properties", "nuc/models/nodes", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function(Backbone, PropertiesCommand, NodeCollection, CommandHelper, lang) {
  "use strict";
  var PermissionsCommand = PropertiesCommand.extend({
    defaults: {
      signature: "D2-Permissions",
      command_key: "D2-Permissions",
      name: lang.CommandNamePermissions,
      verb: lang.CommandVerbPermissions,
      scope: "multiple"
    },
    execute: function(status, options) {
      var node = CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0), containerNode = node.collection && node.collection.node, selectedNodesCollection = this._getAtLeastOneNode(status);
      this.commandStatus = {
        collection: selectedNodesCollection,
        container: containerNode && containerNode.get("container") === true ? containerNode : null,
        context: status.context,
        nodes: new NodeCollection([ node ]),
        selectedTab: new Backbone.Model({
          name: "permissions"
        }),
        supressSuccessMessage: true,
        supressFailMessage: true,
        originatingView: status.originatingView
      };
      return this._executeWithSaveState(this.commandStatus, options).done(function() {
        status.context.viewStateModel.set(status.context.viewStateModel.CONSTANTS.STATE, {
          dropdown: "permissions"
        });
      });
    }
  });
  return PermissionsCommand;
});