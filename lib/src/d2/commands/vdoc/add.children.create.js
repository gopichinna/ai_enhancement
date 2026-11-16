/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/commands/create.file", "d2/utils/creation.utils", "d2/utils/vdoc.creation.utils", "d2/utils/rest.linkrels", "csui/utils/commandhelper", "d2/utils/vdoc.utils", "nuc/models/node/node.model", "d2/controls/globalmessage/globalmessage", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandContentCreate, CreationUtils, VdocCreationUtils, RestLinkrels, CommandHelper, vdUtils, NodeModel, GlobalMessage, NodeCreationSuccessMessageView, lang) {
  "use strict";
  return CommandContentCreate.extend({
    defaults: {
      signature: "D2-vDocCreateFile",
      command_key: "D2-vDocCreateFile",
      name: "create",
      scope: "single"
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this;
      me.done = false;
      options = options || {};
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      me.isLinkedDoc = false;
      status.container = status.container && status.container.parent;
      me.fetchPresetProfile(status, options).then(me.openWizard.bind(me)).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    showSuccessAndClose: function(node, status, wizard) {
      var me = this, p = $.Deferred(), response;
      var nodeList = [ node ];
      var parentNode = status.nodes.models[0];
      var linkedNodes = me._getLinkedNodes(node, wizard), uploadObjModelOptions;
      if (linkedNodes && linkedNodes.length > 0) {
        nodeList = nodeList.concat(linkedNodes);
      }
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
        VdocCreationUtils.addChildToVd(parentNode, [ node ], me.get("signature")).done(function(obj) {
          uploadObjModelOptions = {
            inSameContainer: true,
            status: status,
            linkedNodes: linkedNodes,
            nodeList: nodeList,
            node: node
          };
          response = obj;
          if (response["operation-status"][0].status === "200") {
            uploadObjModelOptions.isSuccess = true;
            uploadObjModelOptions.parent = parentNode;
            me.handleUploadObjModel(uploadObjModelOptions);
            me._announceOperationEnd(undefined, status);
            var vdmNumber = vdUtils.getVDMNumber(parentNode);
            if (!vdUtils.isVirtualDoc(parentNode)) {
              vdmNumber = vdUtils.getParentVDMNumber(parentNode);
            }
            if (vdmNumber) {
              status.collection.refresh({
                vdmNumber: vdmNumber
              }).done(function() {
                status.collection.trigger("children:added", vdUtils.getVDMNumber(parentNode));
                p.resolve();
              }).fail(function(err) {
                p.reject(err);
              });
            } else {
              p.resolve();
            }
          } else {
            var error = {};
            error.responseJSON = {};
            error.responseJSON.details = response["operation-status"][0]["rest-error"].details || response["operation-status"][0]["rest-error"].message;
            uploadObjModelOptions.isSuccess = false;
            me.handleUploadObjModel(uploadObjModelOptions);
            p.reject();
          }
        }).fail(function(err) {
          uploadObjModelOptions.isSuccess = false;
          uploadObjModelOptions.err = err;
          this.handleUploadObjModel(uploadObjModelOptions);
          p.reject(err);
        });
      }
      me.checkProcessingPanel(node, status, wizard).done(function() {
        onSuccess();
      }).fail(function(progressPanel, error) {
        GlobalMessage.showMessage("error", lang.ObjectFetchFailed, error);
        p.reject(error);
      });
      return p.promise();
    },
    showErrorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, this.getDefaultErrorMessage(), _.isString(error) ? error : error && error.responseJSON && (error.responseJSON.details || error.responseJSON.message));
    },
    getDefaultErrorMessage: function() {
      return lang.VDocAddChildErrorMessage;
    }
  });
});