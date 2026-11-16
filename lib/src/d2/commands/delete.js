/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "csui/utils/command.error", "csui/utils/contexts/factories/application.scope.factory", "d2/commands/node.progress.command", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, ModalAlert, CommandHelper, CommandError, ApplicationScopeModelFactory, NodeProgressCommand, utils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "Delete",
      command_key: "Delete",
      name: lang.CommandNameDelete,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      scope: "multiple"
    },
    preProcess: function(status, options) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status), deferred = $.Deferred();
      options.isVirtualDoc = nodes.some(function(node) {
        return node.isVirtualDoc && node.isVirtualDoc();
      });
      options.isMultiLink = nodes.some(function(node) {
        return Array.isArray(node.get("i_folder_id")) && node.get("i_folder_id").length > 1;
      });
      options.isContainer = nodes.some(function(node) {
        return node.get("container");
      });
      options.isFile = nodes.some(function(node) {
        return !node.get("container");
      });
      if (utils.isMobile()) {
        options.suppressProgress = true;
      }
      me._confirmAction(status, options).done(function(deleteOptions) {
        options.enableCancel = nodes.length > 1;
        options.deleteOptions = deleteOptions;
        deferred.resolve();
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },
    doAction: function(node, options) {
      var deferred = $.Deferred(), collection = node.collection;
      if (!collection) {
        deferred.reject(new CommandError(_.str.sformat(lang.DeleteManyItemsOneFailMessage, node.get("name")), {
          errorDetails: "collection is undefined"
        }));
      } else if (node.get("reserved")) {
        deferred.reject(new CommandError(lang.DeleteCheckedOutDocumentFailed));
      } else {
        node.destroy({
          wait: true,
          deleteOptions: options.deleteOptions,
          container: options.container
        }).done(function() {
          deferred.resolve(node);
        }).fail(function(error) {
          var commandError = error ? new CommandError(utils.parseAjaxError(error), node) : error;
          deferred.reject(commandError);
        });
      }
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var deferred = $.Deferred();
      require([ "csui/utils/contexts/factories/next.node", "csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view", "csui/widgets/metadata/metadata.view", "d2/widgets/document.overview/document.overview.view" ], function(NextNodeModelFactory, MetadataNavigationView, MetadataView, DocumentOverview) {
        var node = results.length === 1 && results[0], collection = results && results[0] && results[0].collection, sourceCollection = options.originatingView && options.originatingView.collection, reloadCollection = false, anyFailed = false, deletedIds = _.compact(_.map(results || [], function(result) {
          if (result instanceof Backbone.Model) {
            return result.get("id");
          } else if (result !== undefined) {
            anyFailed = true;
          }
        }));
        if (!options.deleteOptions || !options.deleteOptions.deleteAllVersions) {
          reloadCollection = true;
        }
        if (deletedIds.length > 0) {
          options.context.trigger("d2:objects:deleted", deletedIds);
        }
        if (options.originatingView instanceof DocumentOverview) {
          deferred.resolve(results);
          options.context.getModel(ApplicationScopeModelFactory).set("id", "");
        } else if (options.originatingView instanceof MetadataNavigationView) {
          options.context.viewStateModel.restoreLastFragment();
          deferred.resolve(results);
        } else if (options.originatingView instanceof MetadataView) {
          var deletedNode = results[0].get("id"), previousHistoryIndex = -1, navigationHistory = options.context.viewStateModel.getHistory();
          _.find(navigationHistory, function(history, index) {
            if (history.fragment === "nodes/" + deletedNode) {
              previousHistoryIndex = index - 1;
            }
          });
          options.context.viewStateModel.restoreHistoryEntryByIndex(previousHistoryIndex);
        } else if (!anyFailed && node && options.container && node.get("id") === options.container.get("id")) {
          setTimeout(function() {
            if (options.isContainer) {
              options.context.viewStateModel.restoreLastFragment();
            } else {
              var nextNode = options.context.getModel(NextNodeModelFactory), parentId = options.container.get("i_folder_id")[0];
              nextNode.set("id", parentId);
            }
            deferred.resolve(results);
          });
        } else {
          var promises = [];
          if (reloadCollection && collection && collection.length > 0) {
            promises.push(collection.fetch({
              reload: true
            }));
          }
          if (sourceCollection) {
            promises.push(sourceCollection.fetch({
              reload: true
            }));
          }
          $.whenAll.apply($, promises).done(deferred.resolve).fail(deferred.reject);
        }
      }, deferred.reject);
      return deferred.promise();
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.DeletingOneItem,
        multiFilePending: lang.DeletingManyItems,
        oneFileSuccess: lang.DeleteOneItemSuccessMessage,
        multiFileSuccess: lang.DeleteManyItemsSuccessMessage,
        oneFileFailure: lang.DeleteOneItemFailMessage,
        multiFileOneFailure: lang.DeleteManyItemsOneFailMessage,
        multiFileFailure: lang.DeleteManyItemsFailMessage,
        someItemsStopped: lang.DeleteStopped,
        actionType: "DELETE"
      };
    },
    _confirmAction: function(status, options) {
      var deferred = $.Deferred();
      if (!options.dontPromptAllVersionDeletePopup) {
        var title = this._getDialogTitle(status);
        require([ "d2/dialogs/modal.delete/deleteDialog" ], function(deleteDialog) {
          deleteDialog.confirmQuestion(title, {
            isVirtualDoc: options.isVirtualDoc,
            isMultiLink: options.isMultiLink,
            isContainer: options.isContainer,
            isFile: options.isFile
          }).done(deferred.resolve).fail(deferred.reject);
        });
      } else {
        ModalAlert.confirmQuestion(function(result) {
          if (result) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        }, options.deleteConfirmAlertMessage, lang.SingleDeleteCommandConfirmDialogTitle);
      }
      return deferred.promise();
    },
    _getDialogTitle: function(status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      return nodes.length === 1 ? lang.SingleDeleteCommandConfirmDialogTitle : _.str.sformat(lang.MultiDeleteCommandConfirmDialogTitle, nodes.length);
    }
  });
});