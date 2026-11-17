/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "i18n!csui/utils/commands/recycle.bin/nls/lang", "csui/utils/commandhelper", "csui/models/command", "csui/utils/commands/confirmable", "csui/utils/url" ], function(_, $, base, lang, CommandHelper, CommandModel, ConfirmableCommand, Url) {
  "use strict";
  var GlobalMessage;
  const Purge = CommandModel.extend({
    defaults: {
      signature: "SmartViewPurge",
      command_key: [ "Purge" ],
      name: lang.PurgeCommandName
    },
    enabled: function(status, options) {
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    makeApiCall: function(status) {
      var connector = status?.collection?.connector;
      const deferred = $.Deferred();
      var data = new FormData();
      data.append("body", JSON.stringify({
        ids: status.nodes.models.map(item => item.get("id"))
      }));
      var purgeOptions = {
        url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/volumes/recyclebin/nodes/purge"),
        method: "POST",
        contentType: false,
        data: data
      };
      connector.makeAjaxCall(purgeOptions).done(function(model) {
        deferred.resolve(model.results);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    showGlobalMessage: function(results, collection) {
      const successCount = results.success.ids.length, failCount = results.failure.ids.length;
      var node, nodeName;
      if (successCount === 1) {
        node = collection.findWhere({
          id: results.success.ids[0]
        });
        nodeName = node.get("name");
      } else if (successCount === 0 && failCount === 1) {
        node = collection.findWhere({
          id: results.failure.ids[0]
        });
        nodeName = node.get("name");
      }
      if (successCount === 1 && failCount === 0) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeOneItemSuccessMessage, nodeName));
      } else if (successCount === 0 && failCount === 1) {
        GlobalMessage.showMessage("error", _.str.sformat(lang.PurgeOneItemFailMessage, nodeName));
      } else if (successCount === 1 && failCount > 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeSingleSuccessMultipleFail, nodeName, failCount));
      } else if (successCount > 1 && failCount === 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeMultipleSuccessSingleFail, successCount, failCount));
      } else if (successCount === 1 && failCount === 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeSingleSuccessSingleFail, nodeName, failCount));
      } else if (successCount > 0 && failCount > 0) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeMutipleSuccessMultipleFail, successCount, failCount));
      } else if (successCount > 0 && failCount === 0) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.PurgeMultipleSuccess, successCount));
      } else if (successCount === 0 && failCount > 0) {
        GlobalMessage.showMessage("error", _.str.sformat(lang.PurgeMultipleFail, failCount));
      }
    },
    _getConfirmTemplate: function(status, options) {
      return _.template(lang.PurgeItemsCommandConfirmDialogHtml);
    },
    _getConfirmData: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var msg = nodes.length === 1 ? _.str.sformat(lang.PurgeCommandConfirmDialogSingleMessage, nodes.at(0).get("name")) : _.str.sformat(lang.PurgeCommandConfirmDialogMultipleMessage, nodes.length);
      return {
        title: lang.PurgeCommandConfirmDialogTitle,
        message: msg
      };
    },
    _getButtons: function() {
      var buttons = {
        buttons: {
          labelYes: lang.PurgeBtnLabel,
          labelNo: lang.PurgeBtnCancel
        }
      };
      return buttons;
    }
  });
  _.extend(Purge.prototype, ConfirmableCommand, {
    execute: function(status, options) {
      var deferred = $.Deferred(), self = this;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      require([ "csui/controls/globalmessage/globalmessage" ], function(localGlobalMessage) {
        GlobalMessage = localGlobalMessage;
        self._executePurgeItems(status, options).then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },
    _executePurgeItems: function(status, options) {
      var self = this;
      options || (options = {});
      var deferred = $.Deferred(), collection = status.collection, originatingView = status?.originatingView;
      ConfirmableCommand.execute.apply(this, arguments).done(function(results) {
        deferred.resolve(results);
        self.showGlobalMessage(results, collection);
        const successfullyPurged = results.success.ids;
        successfullyPurged.forEach(id => collection.remove(collection.findWhere({
          id: id
        })));
      }).fail(function(results) {
        deferred.reject(results);
        if (results?.responseJSON?.results) {
          self.showGlobalMessage(results.responseJSON.results, collection);
        } else if (results) {
          const error = new base.Error(results);
          GlobalMessage.showMessage("error", error.message);
        }
      }).always(function() {
        originatingView?.unblockActions();
      });
      return deferred.promise();
    },
    _performActions: function(status, options) {
      options || (options = {});
      var self = this, deferred = $.Deferred();
      status?.originatingView?.blockActions();
      this.makeApiCall(status, options).done(function(model) {
        deferred.resolve(model);
      }).fail(function(error) {
        deferred.resolve(error);
      });
      return deferred.promise();
    }
  });
  return Purge;
});