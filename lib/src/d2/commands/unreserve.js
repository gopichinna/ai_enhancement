/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "csui/utils/command.error", "csui/utils/contexts/factories/connector", "csui/controls/form/pub.sub", "d2/commands/node.progress.command", "d2/commands/mixin/ba.actions/ba.actions.mixin", "d2/models/virtual.document.children", "d2/models/workflow/task.files", "d2/commands/download", "d2/dialogs/user.settings/user.settings.utils", "dctmw/utils/utils", "d2/utils/vdoc.utils", "dctmw/utils/rest.resources", "d2/utils/constants", "d2/ctf/constants", "d2/utils/widget.constants", "d2/utils/rest.linkrels", "d2/ctf/ctfBridge", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, CommandHelper, CommandError, ConnectorFactory, PubSub, NodeProgressCommand, BaActionsMixin, VirtualDocumentChildren, TaskFileCollection, DownloadCommand, userSettingsUtils, utils, vdocUtils, RestResources, constants, ctfConstants, widgetConstants, RestLinkrels, ctfBridge, lang) {
  "use strict";
  var UnReserveDoc = NodeProgressCommand.extend({
    defaults: {
      signature: "UnreserveDoc",
      command_key: "UnreserveDoc",
      name: lang.CommandNameUnreserve,
      pageLeavingWarning: lang.UnreservePageLeavingWarning,
      scope: "multiple"
    },
    preProcess: function(status, options) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status);
      if (status.collection && status.collection.widgetType === widgetConstants.D2.RELATIONS && status.nodes.length > 1) {
        status.nodes.model.prototype.idAttribute = "id";
        status.nodes.reset(status.nodes.models);
        status.nodes.model.prototype.idAttribute = "associate_id";
      }
      if (utils.isMobile()) {
        options.suppressProgress = true;
      }
      var collaboratedNodes = nodes.filter(function(node) {
        return node.get("externalShare") && node.get("externalShare").core && node.get("externalShare").shareMode === constants.ShareIntentType.COLLABORATE;
      });
      return me._confirmStopShare(collaboratedNodes).then(function(check) {
        options.coreCheck = check;
        return me._performCtfCheck(status, options, check === "none" ? false : check);
      }).then(function(isCtf) {
        return isCtf ? me._confirmLocalFileDeletion(status, options) : me._showConfirmationDialog(lang.UnreserveConfirmationMessage, status, options);
      });
    },
    doAction: function(node, options) {
      var me = this, deferred = $.Deferred();
      $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(node, me.get("signature")),
        type: "DELETE",
        data: options["ba_data"] ? JSON.stringify(options["ba_data"]) : "",
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function() {
          node.set({
            reserved: false
          });
          node.unset("reserved_date");
          node.unset("reserved_user_id");
          node.unset("reserved_user_id_expand");
          if (ctfBridge.isCtfEnabled()) {
            var dlHelper = new DownloadCommand();
            dlHelper.fetchDownloadUrls(node, RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS)).done((downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) => {
              var checkoutPath = downloadLocationPath.checkout;
              if (checkoutPath) {
                ctfBridge.publishRemoveFileFromCheckout(checkoutPath, node.get("id"));
              }
            });
          }
          var href = CommandHelper.getOriginalActionLink(node, "D2-ShareToCoreStop");
          if (options.coreCheck === true && href && node.get("externalShare") && node.get("externalShare").core && node.get("externalShare").shareMode === constants.ShareIntentType.COLLABORATE) {
            require([ "dctmw/dialogs/authentication/core.login.dialog" ], function(CoreLoginDialog) {
              var dialog = new CoreLoginDialog({
                connector: node.connector
              });
              dialog.login().done(function() {
                $.ajax(node.connector.extendAjaxOptions({
                  url: href,
                  type: "DELETE",
                  success: function() {
                    deferred.resolve(node);
                  },
                  error: function(request) {
                    deferred.reject(new CommandError(request));
                  }
                }));
              }).fail(function(request) {
                deferred.reject(new CommandError(request));
              });
            });
          } else {
            deferred.resolve(node);
          }
        },
        error: function(xhr, textStatus, error) {
          deferred.reject(new CommandError(utils.parseAjaxErrorAsString(xhr, textStatus, error)));
        }
      }));
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var collection = options.collection, widgetConfig = {}, promises = [];
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      var unreservedIds = [];
      if (collection instanceof VirtualDocumentChildren) {
        var vdmList = _.uniq(_.map(results, function(result) {
          if (result instanceof Backbone.Model) {
            return vdocUtils.isVirtualDoc(result) ? vdocUtils.getVDMNumber(result) : vdocUtils.getParentVDMNumber(result);
          }
        }));
        if (vdmList.length > 0) {
          unreservedIds.push(vdmList);
          promises.push(collection.refresh({
            vdmNumber: vdmList
          }));
        }
      } else {
        _.each(results, function(result) {
          if (result instanceof Backbone.Model) {
            unreservedIds.push(result.get("id"));
            if (_.isEmpty(widgetConfig)) {
              widgetConfig.widgetType = result.collection?.widgetType;
              widgetConfig.widgetName = result.collection?.options?.widgetName;
              widgetConfig.isDisableLocationColumn = result.collection?.options?.isDisableLocationColumn;
            }
            if (result.get("rObjectType") === "d2c_note") {
              result.collection.fetch({
                reload: true,
                skipSWCache: true
              });
            } else {
              result.collection.map(function(item) {
                if (result.get("id") === item.get("id")) {
                  promises.push(CommandHelper.refreshNode(item, widgetConfig));
                }
              });
            }
          }
        });
      }
      if (unreservedIds.length > 0) {
        options.context.trigger("d2:objects:unreserved", unreservedIds);
      }
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.UnreservingOneItem,
        multiFilePending: lang.UnreservingManyItems,
        oneFileSuccess: lang.UnreserveOneItemSuccessMessage,
        multiFileSuccess: lang.UnreserveManyItemsSuccessMessage,
        oneFileFailure: lang.UnreserveOneItemFailMessage,
        multiFileOneFailure: lang.UnreserveManyItemsOneFailMessage,
        multiFileFailure: lang.UnreserveManyItemsFailMessage,
        someItemsStopped: lang.UnreserveStopped,
        actionType: "UNRESERVE"
      };
    },
    _confirmStopShare: function(collaboratedNodes) {
      var deferred = $.Deferred();
      if (collaboratedNodes.length > 0) {
        require([ "d2/dialogs/modal.stopshare/stopShareDialog", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert" ], function(StopShareDialog, ModalAlert) {
          var filename = collaboratedNodes.length === 1 && collaboratedNodes[0].get("name"), stopShareDialog = new StopShareDialog({
            checkboxMessage: lang.UnreserveContinueShare,
            message: filename ? _.str.sformat(lang.UnreserveStopShareConfirmationMessageSingleItem, filename) : lang.UnreserveStopShareConfirmationMessageManyItems
          });
          ModalAlert.confirmQuestion(function(result) {
            if (result) {
              deferred.resolve(stopShareDialog.getCheckboxState() === "true" ? "checked" : true);
            } else {
              deferred.reject();
            }
          }, "", lang.UnreserveConfirmationTitle, {
            buttons: {
              showYes: true,
              labelYes: lang.UnreserveConfirmationYesButtonLabel,
              showNo: false,
              showCancel: true
            },
            contentView: stopShareDialog,
            modalClass: "d2-confirm-cancel-checkout"
          });
        });
      } else {
        deferred.resolve("none");
      }
      return deferred.promise();
    },
    _performCtfCheck: function(status, options, check) {
      var me = this, deferred = $.Deferred();
      if (ctfBridge.isCtfEnabled() && !check) {
        var userpref = me._getUserPreferences(), checkoutPath = userpref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
        if (checkoutPath) {
          ctfBridge.publishCreateDirectory(checkoutPath, function(isValid) {
            if (isValid) {
              options.checkoutPath = checkoutPath;
              deferred.resolve(true);
            } else {
              me._selectCheckoutFolder(status, options).done(function() {
                deferred.resolve(true);
              }).fail(deferred.reject);
            }
          });
        } else {
          me._selectCheckoutFolder(status, options).done(function() {
            deferred.resolve(true);
          }).fail(deferred.reject);
        }
      } else {
        deferred.resolve(false);
      }
      return deferred.promise();
    },
    _selectCheckoutFolder: function(status, options) {
      var deferred = $.Deferred();
      ctfBridge.publishSelectFolder("", ctfConstants.Mode.EDIT, "", function(path) {
        var userpref = {};
        userpref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH] = path;
        userSettingsUtils.updateUserSettings(userpref, {
          connector: status.context.getObject(ConnectorFactory)
        }).done(function() {
          options.checkoutPath = path;
          deferred.resolve();
        });
      }, function() {
        deferred.reject(new Error(lang.SelectResourceFailMessage));
      });
      return deferred.promise();
    },
    _confirmLocalFileDeletion: function(status, options) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), promises = nodes.map(function(node) {
        var innerDfd = $.Deferred();
        ctfBridge.publishIsDownloaded(node.get("id"), options.checkoutPath, function(filePath) {
          if (filePath) {
            innerDfd.reject();
          } else {
            innerDfd.resolve();
          }
        }, function() {});
        return innerDfd.promise();
      });
      $.when.apply($, promises).done(() => this._showConfirmationDialog(lang.UnreserveConfirmationMessage, status, options).then(deferred.resolve, deferred.reject)).fail(() => this._showConfirmationDialog(lang.UnreserveConfirmationCtfMessage, status, options).then(deferred.resolve, deferred.reject));
      return deferred.promise();
    },
    _showConfirmationDialog: function(message, status, options) {
      const deferred = $.Deferred();
      var confirmOptions = {
        signature: "UnreserveDoc",
        message: message,
        nodes: status.nodes,
        showMessage: true,
        labelTitle: lang.UnreserveConfirmationTitle,
        labelYes: lang.UnreserveConfirmationContinueButtonLabel
      };
      this.showConfirmationDialog(confirmOptions).done(function(data) {
        if (data) {
          options["ba_data"] = data;
        }
        deferred.resolve();
      }).fail(deferred.reject);
      return deferred;
    },
    _getUserPreferences: function() {
      return RestResources.getCurrentUser().get("preferences");
    }
  });
  BaActionsMixin.mixin(UnReserveDoc.prototype);
  return UnReserveDoc;
});