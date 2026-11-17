/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "d2/commands/vdoc/vdoc.mixin", "csui/utils/commandhelper", "d2/utils/vdoc.creation.utils", "nuc/models/node/node.model", "d2/utils/vdoc.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, GlobalMessage, NodeCommand, VDocCommandMixin, CommandHelper, VdocCreationUtils, NodeModel, vdUtils, lang) {
  "use strict";
  var VDocReplaceChildBrowse = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocReplaceChildBrowse",
      command_key: "D2-VDocReplaceChildBrowse",
      name: lang.CommandVDocReplaceChildBrowse,
      scope: "single"
    },
    execute: function(status) {
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var me = this, deferred = $.Deferred(), nodeModel = status.data && status.data.useContainer ? status.container : CommandHelper.getJustOneNode(status);
      var container = nodeModel.parent, parentNode = new NodeModel({
        id: vdUtils.getParentVDId(status.nodes.models[0])
      }, {
        connector: status.context.getObject("connector")
      });
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        parentNode.ensureFetched().done(function() {
          status.parent = parentNode;
          container.ensureFetched().done(function() {
            var pickerOptions = {
              dialogTitle: lang.BrowseDialogueTitle,
              connector: container.connector,
              container: container,
              initialContainer: container,
              context: status.context,
              selectMultiple: false,
              includeBrowse: true,
              globalSearch: true,
              includeFavorites: true,
              startLocations: [ "current.location", "favorites" ]
            };
            me.nodePicker = new NodePicker(pickerOptions);
            me.nodePicker.show().done(function(selectedNodes) {
              var childNode = selectedNodes["nodes"][0];
              VdocCreationUtils.replaceVdChild(status, childNode, me.get("signature")).done(function(data) {
                GlobalMessage.showMessage("success", _.str.sformat(lang.ReplaceChildSuccessMessage, status.nodes.models.at(0).get("name"), data.properties.object_name));
                deferred.resolve();
              }).fail(function() {
                GlobalMessage.showMessage("error", lang.ReplaceChildErrorMessage);
                deferred.reject();
              });
            }).fail(function(err) {
              if (!err.cancelled) {
                me.showErrorMessage(err, nodeModel);
              }
              deferred.reject();
            });
          }.bind(this)).fail(function(err) {
            me.showErrorMessage(err, nodeModel);
            deferred.reject();
          });
        }).fail(function(err) {
          me.showErrorMessage(err, nodeModel);
          deferred.reject();
        });
      }.bind(this), deferred.reject);
      return deferred.promise();
    },
    showErrorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, lang.ReplaceChildErrorMessage, _.isString(error) ? error : error && (error.responseJSON && error.responseJSON.details || error.message));
    }
  });
  VDocCommandMixin.mixin(VDocReplaceChildBrowse.prototype);
  return VDocReplaceChildBrowse;
});