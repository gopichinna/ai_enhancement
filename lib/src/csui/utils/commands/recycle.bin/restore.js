/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "i18n!csui/utils/commands/recycle.bin/nls/lang", "csui/utils/commandhelper", "csui/models/command", "csui/utils/commands/confirmable", "csui/utils/url", "csui/utils/node.links/node.links" ], function(_, $, base, lang, CommandHelper, CommandModel, ConfirmableCommand, Url, nodeLinks) {
  "use strict";
  var GlobalMessage, nextNodeModelFactory;
  const Restore = CommandModel.extend({
    defaults: {
      signature: "SmartViewRestore",
      command_key: [ "Restore" ],
      name: lang.RestoreCommandName
    },
    enabled: function(status, options) {
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    makeApiCall: function(status, options) {
      var connector = status?.collection?.connector;
      const deferred = $.Deferred();
      var data = new FormData();
      data.append("body", JSON.stringify({
        ids: status.nodes.models.map(item => item.get("id"))
      }));
      var restoreOptions = {
        url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/volumes/recyclebin/nodes/restore"),
        method: "POST",
        contentType: false,
        data: data
      };
      connector.makeAjaxCall(restoreOptions).done(function(model) {
        deferred.resolve(model.results);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    showGlobalMessage: function(results, collection, context) {
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
        let targetLocation = {
          id: node.parent.get("id"),
          url: nodeLinks.getUrl(node.parent)
        };
        let options = {
          gotoLocation: lang.GotoLocationLinkLabel,
          targetLocation: targetLocation,
          targetLocationUrl: targetLocation && targetLocation.url,
          doAutoClose: targetLocation && targetLocation.url ? false : true,
          context: context,
          currentNode: node,
          nextNodeModelFactory: nextNodeModelFactory
        };
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreOneItemSuccessMessage, nodeName), "", options);
      } else if (successCount === 0 && failCount === 1) {
        GlobalMessage.showMessage("error", _.str.sformat(lang.RestoreOneItemFailMessage, nodeName));
      } else if (successCount === 1 && failCount > 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreSingleSuccessMultipleFail, nodeName, failCount));
      } else if (successCount > 1 && failCount === 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreMultipleSuccessSingleFail, successCount, failCount));
      } else if (successCount === 1 && failCount === 1) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreSingleSuccessSingleFail, nodeName, failCount));
      } else if (successCount > 0 && failCount > 0) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreMutipleSuccessMultipleFail, successCount, failCount));
      } else if (successCount > 0 && failCount === 0) {
        GlobalMessage.showMessage("success", _.str.sformat(lang.RestoreMultipleSuccess, successCount));
      } else if (successCount === 0 && failCount > 0) {
        GlobalMessage.showMessage("error", _.str.sformat(lang.RestoreMultipleFail, failCount));
      }
    },
    _getConfirmTemplate: function(status, options) {
      return _.template(lang.RestoreItemsCommandConfirmDialogHtml);
    },
    _getConfirmData: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var msg = nodes.length === 1 ? _.str.sformat(lang.RestoreCommandConfirmDialogSingleMessage, nodes.at(0).get("name")) : _.str.sformat(lang.RestoreCommandConfirmDialogMultipleMessage, nodes.length);
      return {
        title: lang.RestoreCommandConfirmDialogTitle,
        message: msg
      };
    },
    _getButtons: function() {
      var buttons = {
        buttons: {
          labelYes: lang.RestoreBtnLabel,
          labelNo: lang.RestoreBtnCancel
        }
      };
      return buttons;
    }
  });
  _.extend(Restore.prototype, ConfirmableCommand, {
    execute: function(status, options) {
      var deferred = $.Deferred(), self = this;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      require([ "csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/next.node" ], function(localGlobalMessage, localNextNodeModelFactory) {
        GlobalMessage = localGlobalMessage;
        nextNodeModelFactory = localNextNodeModelFactory;
        self._executeRestoreItems(status, options).then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },
    _executeRestoreItems: function(status, options) {
      var self = this;
      options || (options = {});
      var deferred = $.Deferred(), collection = status.collection, context = status && status.context, originatingView = status?.originatingView;
      ConfirmableCommand.execute.apply(this, arguments).done(function(results) {
        deferred.resolve(results);
        self.showGlobalMessage(results, collection, context);
        const successfullyRestored = results.success?.ids;
        successfullyRestored.forEach(id => collection.remove(collection.findWhere({
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
  return Restore;
});