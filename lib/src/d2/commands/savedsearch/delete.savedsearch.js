/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "csui/utils/command.error", "d2/commands/delete", "d2/utils/constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, ModalAlert, CommandHelper, CommandError, DeleteCommand, constants, utils, lang) {
  "use strict";
  return DeleteCommand.extend({
    defaults: {
      signature: "D2-DeleteSavedSearch",
      command_key: "D2-DeleteSavedSearch",
      name: lang.CommandNameDeleteSearchObject,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      scope: "multiple"
    },
    enabled: function(status) {
      var container = status.container, enabled = DeleteCommand.prototype.enabled.apply(this, arguments);
      if (enabled && container.isAvailablePublic()) {
        enabled = container.searchConfig && container.searchConfig.canCreatePublicSearch;
      }
      return enabled;
    },
    preProcess: function(status, options) {
      var deferred = $.Deferred();
      this._confirmAction(status).done(function(deleteOptions) {
        options.deleteOptions = deleteOptions;
        deferred.resolve();
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },
    doAction: function(node, options) {
      return node.destroy({
        wait: true,
        deleteOptions: options.deleteOptions,
        container: options.container
      });
    },
    handleResults: function(results, options) {
      var deferred = $.Deferred();
      var node = results.length === 1 && results[0], sourceCollection = options.originatingView && options.originatingView.collection, container = sourceCollection && sourceCollection.node, anyFailed = _.find(results, function(result) {
        return result && !(result instanceof Backbone.Model);
      });
      if (!anyFailed && node && container && node.get("id") === container.get("id")) {
        var deletedNodeId = container.get("id"), parentId = container.get("parent_id");
        container.set("id", parentId);
        container.trigger("d2:node:removed", deletedNodeId);
        deferred.resolve(results);
      } else {
        sourceCollection.fetch({
          reload: true,
          skipSWCache: true
        }).done(deferred.resolve).fail(deferred.reject);
      }
      return deferred.promise();
    },
    _confirmAction: function(status) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), isMultiple = nodes.length > 1, hasSearchObj, hasSearchgroup, title, message;
      nodes.each(function(node) {
        var isCategory = node.isCategoryNode();
        hasSearchObj = hasSearchObj || !isCategory;
        hasSearchgroup = hasSearchgroup || isCategory;
      });
      if (hasSearchObj && hasSearchgroup) {
        title = lang.AdvanceSearchMultipleDeleteConfirmTitle;
        message = lang.AdvanceSearchCategoryMutipleDeleteConfirmMessage;
      } else if (hasSearchgroup) {
        title = isMultiple ? _.str.sformat(lang.AdvanceSearchMultipleCategoryDeleteConfirmTitle, nodes.length) : _.str.sformat(lang.AdvanceSearchSingleDeleteConfirmTitle, nodes.at(0).get("name"));
      } else {
        title = isMultiple ? _.str.sformat(lang.AdvanceSearchMultipleSearchDeleteConfirmTitle, nodes.length) : _.str.sformat(lang.AdvanceSearchSingleDeleteConfirmTitle, nodes.at(0).get("name"));
      }
      if (hasSearchgroup) {
        require([ "d2/dialogs/modal.delete/deleteDialog" ], function(deleteDialog) {
          deleteDialog.confirmQuestion(title, {
            message: message,
            isSavedSearchCategory: true
          }).done(deferred.resolve).fail(deferred.reject);
        });
      } else {
        ModalAlert.confirmQuestion(function(result) {
          result ? deferred.resolve() : deferred.reject();
        }, "", title, {
          buttons: {
            labelYes: lang.AdvanceSearchDeleteButtonLabel,
            showNo: false,
            showCancel: true
          }
        });
      }
      return deferred.promise();
    },
    getMessageOptions: function() {
      var msg = DeleteCommand.prototype.getMessageOptions.apply(this, arguments);
      return _.defaults({
        oneFileFailure: lang.AdvanceSearchDeleteOneItemFailMessage,
        multiFileOneFailure: lang.AdvanceSearchDeleteManyItemsOneFailMessage,
        multiFileFailure: lang.AdvanceSearchDeleteManyItemsFailMessage
      }, msg);
    }
  });
});