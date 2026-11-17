/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/controls/globalmessage/globalmessage", "csui/utils/commandhelper", "csui/utils/commands/node", "nuc/utils/url", "d2/commands/vdoc/vdoc.mixin", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/node.version.utils", "d2/utils/vdoc.utils", "d2/utils/vdoc.creation.utils", "i18n!d2/commands/nls/localized.strings", "css!d2/commands/impl/d2.vd.modal.dialog.with.form" ], function(require, _, $, Backbone, GlobalMessage, CommandHelper, NodeCommand, Url, VDocCommandMixin, ModalAlert, RestLinkrels, constants, nodeVersionUtil, vdUtils, vDocCreationUtils, lang) {
  "use strict";
  var VDocSetChildVersion = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocSetChildVersion",
      command_key: "D2-VDocSetChildVersion",
      name: lang.CommandVDocSetChildVersion,
      scope: "single"
    },
    execute: function(status) {
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      let node = CommandHelper.getJustOneNode(status), self = this, dfd = $.Deferred(), isExpandedView = status.originatingView?.options?.isExpandedView, explorerView = status.originatingView?.options?.explorerView || status.originatingView?.explorerView;
      if (!explorerView) {
        isExpandedView = false;
      }
      this._fetchVersionList(node).done(function(versionData) {
        self.versionCollection = new Backbone.Collection(_.map(versionData["version-labels"], function(option) {
          return {
            text: option,
            value: option
          };
        }));
        self._getBindingVersion(node).done(function(data) {
          self.bindingVersion = data.binding;
          self._showModal(node, status).done(function(data) {
            self._setBindingVersion(node, data, status).done(function(rdata) {
              var vdmNumber = vdUtils.getParentVDMNumber(node);
              if (vdmNumber) {
                let refreshPromise = isExpandedView && vdUtils.isVirtualDoc(node) ? $.Deferred().resolve().promise() : status.collection.refresh({
                  vdmNumber: vdmNumber
                });
                refreshPromise.done(function() {
                  var newNode = CommandHelper.getJustOneNode(status);
                  GlobalMessage.showMessage("success", nodeVersionUtil.isCurrentVersion(newNode) ? _.str.sformat(lang.CommandVDocSetChildVersionCurrentSuccessMessage, node.get("name")) : _.str.sformat(lang.CommandVDocSetChildVersionSuccessMessage, node.get("name"), data));
                  if (explorerView && vdUtils.isVirtualDoc(newNode)) {
                    explorerView.handleVersionChangeInVDTreeNode([ newNode ], _.extend({
                      isExpandedView: isExpandedView
                    }, status)).always(() => {
                      dfd.resolve(rdata);
                    });
                  } else {
                    dfd.resolve(rdata);
                  }
                }).fail(function(err) {
                  dfd.reject(err);
                });
              } else {
                dfd.resolve(rdata);
              }
              dfd.resolve(rdata);
            }).fail(function(err) {
              self._errorMessage(err, node);
              dfd.reject(err);
            });
          }).fail(function(err) {
            if (!err.cancelFlag) {
              self._errorMessage(err, node);
            }
            dfd.reject(err);
          });
        }).fail(function(err) {
          self._errorMessage(err, node);
          dfd.reject(err);
        });
      }).fail(function(err) {
        self._errorMessage(err, node);
        dfd.reject(err);
      });
      return dfd.promise();
    },
    _errorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, lang.CommandVDocSetChildVersionErrorMessage, _.isString(error) ? error : error && (error.responseJSON && error.responseJSON.message));
    },
    _showModal: function(node, status) {
      var dfd = $.Deferred(), self = this, buttonOptions = {
        showYes: true,
        disableYes: true,
        labelYes: lang.CommandVDocSetChildVersionDialogLabelYes,
        labelCancel: lang.CommandVDocSetChildVersionDialogLabelCancel,
        showNo: false,
        showCancel: true,
        context: status.context
      }, viewOptions = {
        name: node.get("name"),
        bindingVersion: this.bindingVersion,
        versionList: this.versionCollection,
        context: status.context
      };
      require([ "d2/dialogs/set.to.version/set.to.version.dialog.view" ], function(SetToVersionDialogView) {
        var contentView = new SetToVersionDialogView(viewOptions);
        self.listenTo(contentView, "change:field", onFieldValueUpdate);
        function getYesButton() {
          const $modelContent = contentView.$el.closest(".binf-modal-content");
          return $modelContent.find(".binf-modal-footer .csui-yes");
        }
        function onFieldValueUpdate() {
          const $yesButton = getYesButton();
          $yesButton.removeAttr("disabled");
        }
        ModalAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve(contentView.options["vd-version"]);
          } else {
            dfd.reject({
              cancelFlag: true
            });
          }
        }, "", lang.CommandVDocSetChildVersionDialogTitle, {
          buttons: buttonOptions,
          contentView: contentView,
          className: "d2-vd-modal-dialog-with-form"
        });
      }, dfd.reject);
      return dfd.promise();
    },
    _fetchVersionList: function(node) {
      var urlString = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_FETCH_VERSION_VD);
      if (!urlString) {
        return $.Deferred().reject(new Error(lang.CommandVDocSetChildVersionVersionListLinkMissing)).promise();
      } else {
        return $.ajax(node.connector.extendAjaxOptions({
          url: urlString
        }));
      }
    },
    _getbindingVersionURL: function(node) {
      var urlString = CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_SET_BINDING_VD);
      return urlString;
    },
    _getBindingVersion: function(node) {
      var urlString = this._getbindingVersionURL(node);
      if (!urlString) {
        return $.Deferred().reject(new Error(lang.CommandVDocSetChildVersionBindingLinkMissing)).promise();
      } else {
        return $.ajax(node.connector.extendAjaxOptions({
          url: urlString
        }));
      }
    },
    _setBindingVersion: function(node, vdVersion, status) {
      var me = this, parentNode = status.collection.get(vdUtils.getParentVDMNumber(node));
      return vDocCreationUtils.performLockPrecheck([ parentNode ]).then(function() {
        var urlString = me._getbindingVersionURL(node);
        if (!urlString) {
          return $.Deferred().reject(new Error(lang.CommandVDocSetChildVersionBindingLinkMissing));
        } else {
          var data = {
            binding: vdVersion
          };
          return $.ajax(node.connector.extendAjaxOptions({
            url: urlString,
            type: "PATCH",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            data: JSON.stringify(data)
          }));
        }
      });
    }
  });
  VDocCommandMixin.mixin(VDocSetChildVersion.prototype);
  return VDocSetChildVersion;
});