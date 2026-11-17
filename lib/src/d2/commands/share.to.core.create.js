/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "csui/utils/command.error", "csui/utils/contexts/factories/connector", "d2/commands/node.progress.command", "d2/dialogs/share.to.core/impl/share.to.core.utils", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, CommandHelper, CommandError, ConnectorFactory, NodeProgressCommand, shareToCoreUtils, RestLinkrels, utils, constants, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ShareToCoreCreate",
      command_key: "D2-ShareToCoreCreate",
      name: lang.CommandNameShareToCoreCreate,
      pageLeavingWarning: lang.ShareToCoreCreatePageLeavingWarning,
      scope: "multiple"
    },
    enabled: function(status) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status), isEnabled = true;
      if (nodes && nodes.length > 0) {
        nodes.find(function(node) {
          var isContainer = node.get("container"), externalShare = node.get("externalShare"), shareToCoreUrl = CommandHelper.getOriginalActionLink(node, me.get("signature"), RestLinkrels.D2_SHARE_TO_CORE), action = !!node.actions.find(function(action) {
            var signature = action.get("signature");
            if (signature === me.get("signature")) {
              return action;
            }
          });
          if (isContainer || !externalShare || !action || externalShare && externalShare.core === true || !shareToCoreUrl) {
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
      var me = this, deferred = $.Deferred();
      options.connector = status.context.getObject(ConnectorFactory);
      me._blockActions(status);
      require([ "dctmw/dialogs/authentication/core.login.dialog" ], function(CoreLoginDialog) {
        var dialog = new CoreLoginDialog({
          connector: options.connector
        });
        dialog.login().then(function() {
          return shareToCoreUtils.getCorePermissionRoles(status.context);
        }).then(function(collection) {
          return me._showWizardForCreateShare(status, options, collection);
        }).always(function() {
          me._unblockActions(status);
        }).done(deferred.resolve).fail(deferred.reject);
      });
      return deferred.promise();
    },
    doAction: function(node, options) {
      var deferred = $.Deferred(), shareMode = options.shareData.shareIntent, recipients = options.shareData.assigneeList, shareOptions = {};
      if (options.toolItem && options.toolItem.has("actionProperties") && options.toolItem.get("actionProperties").c2Override) {
        shareOptions.c2Override = true;
      }
      shareToCoreUtils.createShare(node, shareMode, recipients, this.get("command_key"), shareOptions).done(function() {
        deferred.resolve(node);
      }).fail(function(error) {
        var errorDetails;
        if (error.responseText) {
          errorDetails = utils.parseAjaxError(error);
        } else {
          errorDetails = error;
        }
        deferred.reject(new CommandError(errorDetails, node));
      });
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var collection = options.collection, widgetConfig = {}, promises = [];
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      var sharedIds = [];
      _.each(results, function(result) {
        if (result instanceof Backbone.Model) {
          sharedIds.push(result.get("id"));
          promises.push(CommandHelper.refreshNode(result, widgetConfig));
        }
      });
      options.context.trigger("d2:objects:shared", sharedIds);
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.ShareToCoreCreatingOneItem,
        multiFilePending: lang.ShareToCoreCreatingManyItems,
        oneFileSuccess: lang.ShareToCoreCreateOneItemSuccessMessage,
        multiFileSuccess: lang.ShareToCoreCreateManyItemsSuccessMessage,
        oneFileFailure: lang.ShareToCoreCreateOneItemFailMessage,
        multiFileOneFailure: lang.ShareToCoreCreateManyItemsOneFailMessage,
        multiFileFailure: lang.ShareToCoreCreateManyItemsFailMessage,
        someItemsStopped: lang.ShareToCoreCreateStopped,
        actionType: "START_SHARE"
      };
    },
    _showWizardForCreateShare: function(status, options, collection) {
      var me = this, deferred = $.Deferred(), permissionCollection = collection;
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/share.to.core/share.to.core.view" ], function(StepperWizard, ShareToCoreView) {
        var shareData = {}, context = status.context, nodes = CommandHelper.getAtLeastOneNode(status), wizard = new StepperWizard({
          steps: [ {
            id: "createShare",
            title: function() {
              return this.shareUsingCoreTitle;
            },
            subTitle: function() {
              return this.wizardSubTitle;
            },
            nextStepId: function() {
              return "finish";
            },
            viewClass: ShareToCoreView,
            viewOptions: {},
            buttons: [ {
              id: "next",
              className: "share-btn",
              label: function() {
                return this.shareBtnCaption;
              },
              disabled: function() {
                return this.shareBtnDisabled;
              },
              clickHandler: function() {
                this.next();
              }
            } ],
            onCancel: function() {
              if (this.checkAssigneeAddedInPermission()) {
                return this.showConfirmationMessage(lang.exitTitle, lang.exitCreateShare, lang.exitButtonLabel);
              } else {
                return $.Deferred().resolve().promise();
              }
            }
          } ],
          data: {
            nodes: nodes,
            collection: permissionCollection,
            shareData: shareData,
            context: context,
            connector: options.connector,
            actionType: constants.ShareActionType.CREATE,
            commandKey: me.get("command_key")
          },
          className: "d2-share-to-core-create-wizard d2-share-to-core-wizard"
        });
        me._unblockActions(status);
        wizard.show().on("wizard:closed", function(isCancel) {
          me._blockActions(status);
          if (isCancel) {
            deferred.reject();
          } else {
            options.shareData = shareData;
            status.nodes.reset(shareData.nodes, {
              silent: true
            });
            deferred.resolve();
          }
        });
      });
      return deferred.promise();
    },
    _blockActions: function(status) {
      status && status.originatingView && status.originatingView.blockActions();
    },
    _unblockActions: function(status) {
      status && status.originatingView && status.originatingView.unblockActions();
    }
  });
});