/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "nuc/utils/url", "d2/commands/node.progress.command", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, ModalAlert, CommandHelper, ConnectorFactory, Url, NodeProgressCommand, RestLinkrels, utils, constants, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ShareToCoreStop",
      command_key: "D2-ShareToCoreStop",
      name: lang.CommandNameD2StopShare,
      scope: "multiple"
    },
    enabled: function(status) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status), isEnabled = true;
      if (nodes && nodes.length > 0) {
        nodes.find(function(node) {
          var isContainer = node.get("container"), externalShare = node.get("externalShare"), action = !!node.actions.find(function(action) {
            var signature = action.get("signature");
            if (signature === me.get("signature")) {
              return action;
            }
          });
          if (isContainer || !externalShare || !action || externalShare && externalShare.core === false) {
            isEnabled = false;
            return true;
          }
        });
      } else {
        isEnabled = false;
      }
      return isEnabled;
    },
    preProcess: function(status, options) {
      var me = this;
      options.connector = status.context.getObject(ConnectorFactory);
      return me._confirmStopShare(status).then(function() {
        return me._checkCoreLogin(options);
      });
    },
    doAction: function(node, options) {
      var deferred = $.Deferred();
      $.ajax(options.connector.extendAjaxOptions({
        url: Url.combine(RestLinkrels.getLink(node.get("links"), RestLinkrels.SELF), "share-to-core"),
        type: "DELETE",
        success: function() {
          var url = CommandHelper.getOriginalActionLink(node, "UnreserveDoc");
          if (url && node.get("externalShare") && node.get("externalShare").core && node.get("externalShare").shareMode === constants.ShareIntentType.COLLABORATE) {
            $.ajax(options.connector.extendAjaxOptions({
              url: url,
              type: "DELETE",
              success: function() {
                deferred.resolve(node);
              },
              error: function(xhr, textStatus, errorThrown) {
                var errobj = {
                  node: node,
                  error: new Error(utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown))
                };
                deferred.reject(errobj);
              }
            }));
          } else {
            deferred.resolve(node);
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          var errobj = {
            node: node,
            error: new Error(utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown))
          };
          deferred.reject(errobj);
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
      var unsharedIds = [];
      _.each(results, function(result) {
        if (result instanceof Backbone.Model) {
          unsharedIds.push(result.get("id"));
          promises.push(CommandHelper.refreshNode(result, widgetConfig));
        }
      });
      options.context.trigger("d2:objects:unshared", unsharedIds);
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.StopShareOneItemPendingMessage,
        multiFilePending: lang.StopShareManyItemsPendingMessage,
        oneFileSuccess: lang.StopShareOneItemSuccessMessage,
        multiFileSuccess: lang.StopShareManyItemsSuccessMessage,
        oneFileFailure: lang.StopShareOneItemFailureMessage,
        multiFileOneFailure: lang.StopShareManyItemsOneFailMessage,
        multiFileFailure: lang.StopShareManyItemsFailureMessage,
        someItemsStopped: lang.StopShareStopped,
        actionType: "STOP_SHARE"
      };
    },
    _confirmStopShare: function(status) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), fileName, message = lang.StopShareConfirmationMessageManyItems;
      if (node) {
        fileName = node.get("name");
        message = _.str.sformat(lang.StopShareConfirmationMessageSingleItem, fileName);
      }
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, message, lang.StopShareConfirmationTitle, {
        buttons: {
          showYes: true,
          labelYes: lang.StopShareDialogButton,
          showNo: false,
          showCancel: true
        }
      });
      return deferred.promise();
    },
    _checkCoreLogin: function(options) {
      var deferred = $.Deferred();
      require([ "dctmw/dialogs/authentication/core.login.dialog" ], function(CoreLoginDialog) {
        var dialog = new CoreLoginDialog({
          connector: options.connector
        });
        dialog.login().done(deferred.resolve).fail(deferred.reject);
      });
      return deferred.promise();
    }
  });
});