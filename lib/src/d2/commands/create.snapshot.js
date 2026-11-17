/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "csui/utils/commandhelper", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "dctmw/server.adaptors/converters/node", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "d2/utils/vdoc.utils", "i18n!d2/commands/nls/localized.strings", "css!d2/commands/impl/d2.vd.modal.dialog.with.form" ], function(_, $, Url, GlobalMessage, NodeCommand, CommandHelper, NodeModel, NodeChildren2Collection, nodeConverter, RestResources, RestLinkrels, constants, NodeCreationSuccessMessageView, vdUtils, lang) {
  "use strict";
  var VDocCreateSnapshot = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocCreateSnapshot",
      command_key: "D2-VDocCreateSnapshot",
      name: lang.CommandVDocCreateSnapshot,
      scope: "single"
    },
    enabled: function(status, options) {
      if (status.nodes && status.nodes.length === 1) {
        var node = CommandHelper.getJustOneNode(status);
        if (node && vdUtils.isVirtualDoc(node)) {
          return NodeCommand.prototype.enabled.call(this, status, options);
        }
      }
      return false;
    },
    execute: function(status) {
      var me = this, node = CommandHelper.getJustOneNode(status);
      me._showDialog(node, status).done(function(data) {
        me.createSnapshot(status, data);
      }).fail(function() {});
      return $.Deferred().resolve().promise();
    },
    createSnapshot: function(status, data) {
      var node = CommandHelper.getJustOneNode(status), view = status.originatingView, deferred = $.Deferred();
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      if (view && view.blockActions) {
        view.blockActions();
      }
      var url = CommandHelper.getOriginalActionLink(node, this.get("signature"));
      var payload = {
        properties: {
          title: data
        }
      };
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(payload),
        success: function(response) {
          var snapShotNode = new NodeModel(undefined, {
            context: status.context,
            connector: node.connector
          });
          snapShotNode.set(nodeConverter.convertNode(response), {
            silent: true
          });
          if (status.collection instanceof NodeChildren2Collection) {
            var container = status.container && status.container.get("id");
            var snapShotLocation = snapShotNode.get("i_folder_id");
            if (container && !_.contains(snapShotLocation, container)) {
              var parent = new NodeModel({
                id: snapShotLocation[0]
              }, {
                connector: node.connector
              });
              parent.ensureFetched().done(function() {
                snapShotNode._foldername = parent.get("name");
                GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
                  showLink: true,
                  node: snapShotNode,
                  context: status.context,
                  successMessageFormat: lang.CreateSnapshotSuccessMessageFormatFolder,
                  linkLabel: lang.CreateItemDoneCommandLabel,
                  link_command_signature: "Browse"
                });
              }).fail(function(xhr, status, err) {
                GlobalMessage.showMessage("error", lang.ObjectFetchFailed, err);
              }).always(function() {
                if (view && view.unblockActions) {
                  view.unblockActions();
                }
                deferred.resolve();
              });
            } else {
              var widgetConfig = {};
              if (status.container && status.container.get("id") && status.collection && status.collection.options) {
                widgetConfig.widgetType = status.collection.widgetType;
                widgetConfig.widgetName = status.collection.options.widgetName;
              }
              CommandHelper.refreshNode(snapShotNode, widgetConfig).done(function() {
                snapShotNode.isLocallyCreated = true;
                snapShotNode.collection = status.collection;
                status.collection.unshift(snapShotNode);
                GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
                  showLink: false,
                  node: snapShotNode,
                  context: status.context,
                  successMessageFormat: lang.CreateSnapshotSuccessMessageFormat
                });
              }).fail(function(xhr, status, err) {
                GlobalMessage.showMessage("error", lang.ObjectFetchFailed, err);
              }).always(function() {
                if (view && view.unblockActions) {
                  view.unblockActions();
                }
                deferred.resolve();
              });
            }
          } else {
            GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
              showLink: true,
              node: snapShotNode,
              context: status.context,
              successMessageFormat: lang.CreateSnapshotSuccessMessageFormat,
              linkLabel: lang.CreateItemDoneCommandLabel,
              link_command_signature: "Browse"
            });
            if (view && view.unblockActions) {
              view.unblockActions();
            }
            deferred.resolve();
          }
        },
        error: function(request) {
          var e = request.responseJSON && request.responseJSON.message || "";
          GlobalMessage.showMessage("error", lang.CreateSnapshotFailMessageFormat, e);
          if (view && view.unblockActions) {
            view.unblockActions();
          }
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    _showDialog: function(node, status) {
      var dfd = $.Deferred();
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/vd.create.snapshot/snapshot.title.picker" ], function(D2ModalAlert, SnapshotForm) {
        var contentView = new SnapshotForm({
          name: node.get("name"),
          context: status.context
        });
        var buttonOptions = {
          showYes: true,
          labelYes: lang.SnapshotCreateYesButtonTitle,
          labelCancel: lang.SnapshotCreateCancelButtonTitle,
          showNo: false,
          showCancel: true,
          context: status.context
        };
        D2ModalAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve(contentView.options["vd-title"]);
          } else {
            dfd.reject({
              cancelFlag: true
            });
          }
        }, "", lang.SnapshotCreateConfirmTitle, {
          buttons: buttonOptions,
          contentView: contentView,
          className: "d2-vd-modal-dialog-with-form"
        });
      });
      return dfd.promise();
    }
  });
  return VDocCreateSnapshot;
});