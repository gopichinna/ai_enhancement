/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/pub.sub", "csui/utils/commandhelper", "d2/commands/delete", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/rest.resources", "nuc/utils/url", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, PubSub, CommandHelper, DeleteCommand, RestLinkrels, constants, RestResources, Url, lang) {
  "use strict";
  return DeleteCommand.extend({
    defaults: {
      signature: "D2-DeleteCollection",
      command_key: "D2-DeleteCollection",
      name: lang.CommandNameDeleteCollection,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      scope: "multiple"
    },
    _blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    _unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    enabled: function() {
      var enabled = DeleteCommand.prototype.enabled.apply(this, arguments);
      return enabled;
    },
    preProcess: function(status, options) {
      var deferred = $.Deferred();
      var me = this;
      this._blockActions(status.originatingView);
      this._confirmAction(status).done(function(deleteOptions) {
        options.deleteOptions = deleteOptions;
        deferred.resolve();
      }).fail(function() {
        me._unblockActions(status.originatingView);
        deferred.reject();
      });
      return deferred.promise();
    },
    doAction: function(container, options) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url + "/collections/" + container.get("id"));
      return $.ajax(container.connector.extendAjaxOptions({
        url: url,
        type: "DELETE",
        contentType: constants.MediaTypes.DCTM_JSON
      })).always(this._unblockActions.bind(this, options.originatingView));
    },
    handleResults: function(results, options) {
      var sourceCollection = options?.originatingView?.options.isCollectionsListView ? options?.originatingView?.collection : options?.originatingView?.d2CollectionsListsWrapperView?.myCollectionsListView?.collection;
      var delModel = sourceCollection.find({
        r_object_id: results[0].get("id")
      });
      var delModelIndex = sourceCollection.indexOf(delModel);
      var targetModel = sourceCollection.length === 1 ? null : sourceCollection.length - 1 > delModelIndex ? sourceCollection.at(delModelIndex + 1) : sourceCollection.at(delModelIndex - 1);
      sourceCollection.remove(delModel);
      sourceCollection.allModels.splice(delModelIndex, 1);
      options.originatingView.selectedModel = undefined;
      if (options.originatingView && options.originatingView.loadTableView) {
        if (targetModel) {
          options.originatingView.loadTableView(targetModel);
        } else {
          options.originatingView.updateTableEmptyViewVisibility();
          options.originatingView.resetTableTitleHeader();
        }
      }
      PubSub.trigger("collectionList:updated", targetModel);
    },
    _confirmAction: function(status) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), title, message;
      title = _.str.sformat(lang.D2CollectionDeleteConfirmTitle, nodes.at(0).get("name"));
      message = _.str.sformat(lang.D2CollectionDeleteConfirmMessage, nodes.at(0).get("name"));
      require([ "d2/dialogs/modal.delete/deleteDialog" ], function(deleteDialog) {
        deleteDialog.confirmQuestion(title, {
          message: message
        }).done(deferred.resolve).fail(deferred.reject);
      });
      return deferred.promise();
    },
    getMessageOptions: function() {
      var msg = DeleteCommand.prototype.getMessageOptions.apply(this, arguments);
      return _.defaults({
        oneFileFailure: lang.D2CollectionDeleteOneItemFailMessage
      }, msg);
    }
  });
});