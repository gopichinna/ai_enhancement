/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "csui/utils/commands/node", "d2/controls/globalmessage/globalmessage", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/dialogs/share.to.core/impl/share.to.core.utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, Marionette, ConnectorFactory, CommandHelper, NodeCommand, GlobalMessage, RestLinkrels, constants, ShareToCoreUtils, lang) {
  "use strict";
  var ShareToCoreManageCommand = NodeCommand.extend({
    defaults: {
      signature: "D2-ShareToCoreManage",
      command_key: "D2-ShareToCoreManage",
      name: lang.CommandNameShareToCoreManage,
      verb: lang.CommandVerbShareToCoreManage,
      pageLeavingWarning: lang.ShareToCoreManagePageLeavingWarning,
      scope: "single"
    },
    enabled: function(status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      if (nodes && nodes.models) {
        if (nodes.models.length === 1) {
          var node = nodes.models[0], isContainer = node.get("container"), externalShare = node.get("externalShare"), shareToCoreUrl = CommandHelper.getOriginalActionLink(node, this.get("command_key"), RestLinkrels.D2_SHARE_TO_CORE), shareToCoreRecipientsUrl = CommandHelper.getOriginalActionLink(node, this.get("command_key"), RestLinkrels.D2_SHARE_TO_CORE_RECIPIENTS);
          var action = !!node.actions.find(function(action) {
            var signature = action.get("signature");
            if (signature === "D2-ShareToCoreManage") {
              return action;
            }
          });
          if (isContainer || !externalShare || !action || externalShare && externalShare.core === false || (!shareToCoreUrl || !shareToCoreRecipientsUrl)) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    },
    execute: function(status, options) {
      var self = this, dfd = $.Deferred(), node = CommandHelper.getJustOneNode(status);
      options = options || {};
      options.connector = status.context.getObject(ConnectorFactory);
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      self.blockActions(status);
      require([ "dctmw/dialogs/authentication/core.login.dialog" ], function(CoreLoginDialog) {
        var dialog = new CoreLoginDialog({
          connector: options.connector
        });
        dialog.login().done(function() {
          ShareToCoreUtils.fetchSharedObjectSettingForManage(node, status.context, self.get("command_key")).done(function(sharedObjectSettings) {
            self.showWizardForManageShare(status, options, sharedObjectSettings, node).done(function() {
              dfd.resolve();
            }).fail(function() {
              dfd.reject();
            });
          }).fail(function(error) {
            self.unblockActions(status);
            if (error && error.responseJSON) {
              GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
            } else {
              GlobalMessage.showMessage("error", lang.ShareToCoreManageUnableToFetchSharedObject);
            }
            dfd.reject();
          });
        }).fail(function() {
          self.unblockActions(status);
          dfd.reject();
        });
      });
      return dfd.promise();
    },
    showWizardForManageShare: function(status, options, sharedObjectSettings, node) {
      var self = this, dfd = $.Deferred(), permissionCollection = sharedObjectSettings.corePermissionRoles;
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/share.to.core/share.to.core.view" ], function(StepperWizard, ShareToCoreView) {
        var shareData = {}, context = status.context, connector = context.getObject(ConnectorFactory), wizard = new StepperWizard({
          steps: [ {
            id: "manageShare",
            title: function() {
              return this.manageUsingCoreTitle;
            },
            subTitle: function() {
              return this.wizardSubTitle;
            },
            nextStepId: function() {
              return "finish";
            },
            viewClass: ShareToCoreView,
            viewOptions: {
              showAssigneeCount: true,
              validateOnRender: true,
              shareIntent: sharedObjectSettings.sharedObject.get("share_mode")
            },
            buttons: [ {
              id: "next",
              className: "update-btn",
              label: function() {
                return this.updateBtnCaption;
              },
              disabled: function() {
                return this.shareBtnDisabled;
              },
              clickHandler: function() {
                this.next();
              }
            } ],
            onCancel: function() {
              var dfd = $.Deferred();
              if (this.checkAssigneeAddedInPermission()) {
                this.showConfirmationMessage(lang.exitTitle, lang.exitManageShare, lang.exitButtonLabel).done(dfd.resolve).fail(dfd.reject);
              } else {
                dfd.resolve();
              }
              return dfd.promise();
            }
          } ],
          data: {
            nodes: new Backbone.Collection([ node ]),
            collection: permissionCollection,
            shareData: shareData,
            context: context,
            connector: connector,
            actionType: constants.ShareActionType.MANAGE,
            commandKey: self.get("command_key")
          },
          className: "d2-share-to-core-manage-wizard d2-share-to-core-wizard"
        });
        self.unblockActions(status);
        wizard.show().on("wizard:closed", function(isCancel) {
          if (isCancel) {
            dfd.reject();
          } else {
            self._performActions(status, options, shareData, sharedObjectSettings).done(dfd.resolve).fail(dfd.reject);
          }
        });
      });
      return dfd.promise();
    },
    _performActions: function(status, options, shareData, sharedObjectSettings) {
      var self = this, deferred = $.Deferred(), node = shareData.nodes[0], shareMode = shareData.shareIntent, oldShareMode = sharedObjectSettings.sharedObject.get("share_mode"), recipients = shareData.assigneeList, widgetConfig = {};
      if (status.collection && status.collection.options) {
        widgetConfig.widgetType = status.collection.widgetType;
        widgetConfig.widgetName = status.collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = status.collection.options.isDisableLocationColumn;
      }
      self.blockActions(status);
      ShareToCoreUtils.modifyShare(node, shareMode, oldShareMode, recipients, self.get("command_key")).done(function() {
        CommandHelper.refreshNode(node, widgetConfig).done(function() {
          GlobalMessage.showMessage("success", lang.ShareToCoreManageOneItemSuccessMessage);
          self.unblockActions(status);
          deferred.resolve(node);
        }).fail(function(error) {
          GlobalMessage.showMessage("error", lang.ShareToCoreManageFailedToRefresh);
          self.unblockActions(status);
          deferred.reject(error);
        });
      }).fail(function(error) {
        GlobalMessage.showMessage("error", lang.ShareToCoreManageOneItemFailMessage);
        self.unblockActions(status);
        deferred.reject(error);
      });
      return deferred.promise();
    },
    blockActions: function(status) {
      status && status.originatingView && status.originatingView.blockActions();
    },
    unblockActions: function(status) {
      status && status.originatingView && status.originatingView.unblockActions();
    }
  });
  return ShareToCoreManageCommand;
});