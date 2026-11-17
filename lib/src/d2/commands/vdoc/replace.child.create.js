/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "d2/commands/create.file", "d2/commands/vdoc/vdoc.mixin", "csui/utils/commandhelper", "d2/utils/creation.utils", "d2/utils/vdoc.creation.utils", "d2/utils/rest.linkrels", "d2/utils/vdoc.utils", "nuc/models/node/node.model", "i18n!d2/commands/nls/localized.strings" ], function(_, $, GlobalMessage, CommandContentCreate, VDocCommandMixin, CommandHelper, CreationUtils, VdocCreationUtils, RestLinkrels, vdUtils, NodeModel, lang) {
  "use strict";
  var VDocReplaceChildCreate = CommandContentCreate.extend({
    defaults: {
      signature: "D2-VDocReplaceChildCreate",
      command_key: "D2-VDocReplaceChildCreate",
      name: lang.CommandVDocReplaceChildCreate,
      scope: "single"
    },
    addNodeInDocList: function() {},
    showSuccessAndClose: function(node, status, wizard) {
      var me = this, p = $.Deferred(), nodeList = [ node ], linkedNodes = me._getLinkedNodes(node, wizard), parentNode = new NodeModel({
        id: vdUtils.getParentVDId(status.nodes.models[0])
      }, {
        connector: status.context.getObject("connector")
      });
      if (linkedNodes && linkedNodes.length > 0) {
        nodeList = nodeList.concat(linkedNodes);
      }
      status.parent = parentNode;
      function onSuccess() {
        if (node.contentCreatedBeforeEdit !== true) {
          CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION);
          if (wizard && !wizard.isDestroyed) {
            wizard.close({
              success: true,
              newNode: node
            });
          }
        }
        parentNode.ensureFetched().done(function() {
          VdocCreationUtils.replaceVdChild(status, node, me.get("signature"), updateProgress).done(function(response) {
            updateProgress({
              name: status.nodes.at(0).get("name"),
              state: "resolved",
              targetLocation: undefined,
              resolvedToastMessage: _.str.sformat(lang.ReplaceChildSuccessMessage, status.nodes.models[0].get("name"), response.properties.object_name)
            });
            p.resolve();
          }).fail(function() {
            updateProgress({
              state: "rejected"
            });
            p.reject();
          });
        }).fail(function(err) {
          updateProgress({
            state: "rejected"
          });
          p.reject(err);
        });
      }
      function updateProgress(options) {
        me.uploadObjectCollection.at(0).set(options || {
          state: "rejected"
        });
      }
      me.checkProcessingPanel(node, status, wizard).done(function() {
        onSuccess();
      }).fail(function(progressPanel, error) {
        updateProgress({
          state: "rejected"
        });
        p.reject(error);
      });
      return p.promise();
    },
    getProgressPanelOptions(status) {
      return {
        oneFilePending: lang.ContentUploadProcessingLabel,
        oneFileSuccess: lang.ReplaceChildSuccessMessage,
        oneFileFailure: lang.ReplaceChildErrorMessage,
        originatingView: status.originatingView,
        context: status.context,
        actionType: "UPLOAD_CONTENT"
      };
    },
    onCancel: function() {
      GlobalMessage.showMessage("warning", lang.ReplaceChildErrorMessage);
    }
  });
  VDocCommandMixin.mixin(VDocReplaceChildCreate.prototype);
  return VDocReplaceChildCreate;
});