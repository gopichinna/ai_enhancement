/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "csui/utils/command.error", "dctmw/utils/utils", "d2/commands/delete", "d2/utils/rest.linkrels", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, ModalAlert, CommandHelper, CommandError, utils, DeleteCommand, RestLinkrels, constants, lang) {
  "use strict";
  return DeleteCommand.extend({
    defaults: {
      signature: "D2-RemoveCollectionItem",
      command_key: "D2-RemoveCollectionItem",
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
    enabled: function(_status, _options) {
      const sharedCollectionWidgetCollection = require("d2/models/d2collections/d2.sharedcollections.collection");
      if (_status.container?.collection instanceof sharedCollectionWidgetCollection || _status.originatingView?.selectedModel.collection instanceof sharedCollectionWidgetCollection) return false;
      return DeleteCommand.prototype.enabled.apply(this, arguments);
    },
    preProcess: function(status, options) {
      var deferred = $.Deferred();
      var self = this;
      this._blockActions(status.originatingView);
      this._confirmAction(status).done(function(deleteOptions) {
        options.deleteOptions = deleteOptions;
        deferred.resolve();
      }).fail(function() {
        self._unblockActions(status.originatingView);
        deferred.reject();
      });
      return deferred.promise();
    },
    doAction: function(node, options) {
      var containerUrl = RestLinkrels.getLink(node.get("parentLinks"), RestLinkrels.SELF);
      var url = containerUrl?.indexOf("?") > -1 ? containerUrl?.substr(0, containerUrl.indexOf("?")) : containerUrl;
      var me = this, deferred = $.Deferred();
      if (url) {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "DELETE",
          data: JSON.stringify({
            items_chronicle_id: [ node.get("i_chronicle_id") ]
          }),
          contentType: constants.MediaTypes.DCTM_JSON,
          success: function() {
            me._unblockActions(options.originatingView);
            deferred.resolve(node);
          },
          error: function(xhr, textStatus, error) {
            me._unblockActions(options.originatingView);
            deferred.reject(new CommandError(utils.parseAjaxErrorAsString(xhr, textStatus, error)));
          }
        }));
      } else {
        deferred.reject();
      }
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var deferred = $.Deferred();
      var successNodes = [];
      const sourceCollection = options.originatingView && options.originatingView.collection;
      if (results && sourceCollection) {
        _.forEach(results, node => {
          if (node instanceof Backbone.Model) {
            sourceCollection.remove(sourceCollection.find({
              id: node.get("id")
            }));
            successNodes.push(node);
          }
        });
      }
      sourceCollection.trigger("d2:clearSelection", {
        nodes: successNodes
      });
      deferred.resolve(results);
      return deferred.promise();
    },
    _confirmAction: function(status) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), isMultiple = nodes.length > 1, title = isMultiple ? _.str.sformat(lang.D2CollectionItemMultipleDeleteConfirmTitle, nodes.length) : _.str.sformat(lang.D2CollectionItemSingleDeleteConfirmTitle, nodes.at(0).get("name"));
      ModalAlert.confirmQuestion(function(result) {
        result ? deferred.resolve() : deferred.reject();
      }, "", title, {
        buttons: {
          labelYes: lang.D2CollectionItemRemoveButtonLabel,
          showNo: false,
          showCancel: true
        }
      });
      return deferred.promise();
    },
    getMessageOptions: function() {
      var msg = DeleteCommand.prototype.getMessageOptions.apply(this, arguments);
      return _.defaults({
        oneFileFailure: lang.D2CollectionItemDeleteOneItemFailMessage,
        multiFileFailure: lang.D2CollectionItemDeleteManyItemsFailMessage,
        multiFileOneFailure: lang.D2CollectionItemDeleteManyItemsOneFailMessage,
        oneFileSuccess: lang.D2CollectionItemSuccessMessage,
        multiFileSuccess: lang.D2CollectionItemsSuccessMessage,
        multiFilePending: lang.D2CollectionsMultiplePending,
        oneFilePending: lang.D2CollectionsOneItemPending,
        someItemsStopped: lang.D2CollectionsSomeItemsStopped
      }, msg);
    }
  });
});