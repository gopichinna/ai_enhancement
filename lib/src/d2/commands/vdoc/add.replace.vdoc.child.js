/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "d2/commands/vdoc/vdoc.mixin", "csui/utils/commandhelper", "d2/utils/vdoc.creation.utils", "nuc/models/node/node.model", "d2/utils/vdoc.utils", "d2/utils/rest.linkrels", "nuc/utils/url", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, GlobalMessage, NodeCommand, VDocCommandMixin, CommandHelper, VdocCreationUtils, NodeModel, vdUtils, RestLinkrels, Url, constants, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-AddReplaceVdoc",
      command_key: "D2-AddReplaceVdoc",
      name: lang.CommandNameAddToCollection,
      verb: lang.CommandNameAddToCollection,
      scope: "multiple"
    },
    execute: function(status) {
      var deferred = $.Deferred();
      this.showDialog(status).done(res => {
        deferred.resolve(res);
      });
      return deferred.promise();
    },
    showDialog(status) {
      var dfd = $.Deferred(), self = this;
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/vd.replace.doc.dialog/vd.replace.doc.dialog.view" ], function(ModelAlert, VdReplaceDocDialogView) {
        ModelAlert.confirmQuestion(function(result) {
          if (result === undefined) {
            dfd.resolve(result);
          } else {
            let selectedOption = this.contentView.$el.find('.AddReplaceForm input[name="AddReplace"]:checked').val();
            self.handleResult(selectedOption, status).done(res => {
              dfd.resolve(res);
            });
          }
        }, "", lang.ReplaceVDDocTitle, {
          buttons: self._getButtonsList(),
          contentView: new VdReplaceDocDialogView(status),
          modalClass: "vd-replace-doc--dialog"
        });
      });
      return dfd.promise();
    },
    _getButtonsList: function() {
      return {
        showYes: true,
        labelYes: lang.ReplaceDialogContinueLabel,
        showNo: false,
        showCancel: true
      };
    },
    handleResult(option, status) {
      if (option === "Add") {
        return this.addNodeAsChild(status.targetNode, status.dragData.nodes);
      } else if (option === "Replace") {
        return this.replaceDoc(status.data.node.parent.data.origNode, status.targetNode, status.dragData.nodes);
      }
    },
    addNodeAsChild(parentNode, childNodes) {
      let href = RestLinkrels.getLink(parentNode.get("links"), RestLinkrels.ADD_VIRTUAL_DOCUMENT_NODES), deferred = $.Deferred(), qParams = {}, payload = {};
      qParams["inline"] = true;
      qParams["suppress-checkout-warning"] = true;
      payload["virtual-document-nodes"] = childNodes.map(item => {
        return {
          "chronicle-id": item["i_chronicle_id"]
        };
      });
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      $.ajax(parentNode.connector.extendAjaxOptions({
        url: href,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(result) {
          deferred.resolve(result);
        },
        error: function(result) {
          require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
            GlobalMessage.showMessage("error", result.responseJSON.message);
          });
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    },
    replaceDoc(parentNode, targetNode, childNodes) {
      let relationId = targetNode.get("relation-id"), vdmNumber = targetNode.get("vdm-number");
      let href = RestLinkrels.getLink(parentNode.get("links"), RestLinkrels.VD_NODE_CHILDREN), deferred = $.Deferred(), qParams = {}, payload = {
        "chronicle-id": childNodes[0].i_chronicle_id
      };
      qParams["inline"] = true;
      qParams["relation-id"] = relationId;
      href = Url.appendQuery(href + "/" + vdmNumber, Url.combineQueryString(qParams));
      $.ajax(targetNode.connector.extendAjaxOptions({
        url: href,
        type: "PATCH",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(result) {
          GlobalMessage.showMessage("success", targetNode.get("name") + lang.ReplaceSuccesfulMessage);
          deferred.resolve(result);
        },
        error: function(result) {
          GlobalMessage.showMessage("error", result.responseJSON.message);
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    }
  });
});