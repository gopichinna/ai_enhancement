/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/nls/lang", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commandhelper", "csui/utils/commands/node", "csui/models/command" ], function(_, $, publicLang, lang, CommandHelper, NodeCommand, CommandModel) {
  "use strict";
  var UnreserveCommand = NodeCommand.extend({
    defaults: {
      signature: "UnreserveDoc",
      command_key: [ "unreserve", "UnreserveDoc" ],
      name: publicLang.CommandNameUnreserve,
      verb: lang.CommandVerbUnreserve,
      pageLeavingWarning: lang.UnreservePageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.UnreserveItemsNoneMessage,
        formatForOne: publicLang.UnreserveOneItemSuccessMessage,
        formatForTwo: publicLang.UnreserveSomeItemsSuccessMessage,
        formatForFive: publicLang.UnreserveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.UnreserveItemsNoneMessage,
        formatForOne: publicLang.UnreserveOneItemFailMessage,
        formatForTwo: publicLang.UnreserveSomeItemsFailMessage,
        formatForFive: publicLang.UnreserveManyItemsFailMessage
      }
    },
    enabled: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var isReleaseOrRevision = _.find(nodes.models, function(node) {
        return _.contains([ 138, 139 ], node.get("type"));
      });
      if (isReleaseOrRevision) {
        return false;
      } else {
        if (nodes && nodes.length) {
          var isOlderVersion = nodes.some(function(node) {
            return node.has("versions") && node.get("versions").current_version === false;
          });
          if (isOlderVersion) {
            return false;
          }
        }
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
    },
    _performAction: function(node, options) {
      let deferred = $.Deferred();
      node.isUnreservedClicked = true;
      CommandHelper.updateNode(node, {
        reserved_user_id: null
      }).done(function(res) {
        deferred.resolve(res);
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    },
    preExecute: function(node) {
      if (node.collection && node.collection.options && !!node.collection.options.removeModelOnUnReserve) {
        node.trigger("before:unreserve");
      }
    },
    postExecute: function(status, node) {
      var collection = status.collection || node.collection;
      if (collection && collection.options && !!collection.options.removeModelOnUnReserve) {
        node.trigger("unreserve", node);
        collection.remove(node);
        collection.totalCount -= 1;
        collection.trigger("pubsub:update:unreserve", {
          idToListen: collection.cid
        });
        if (status.context._applicationScope.get("id") === "myreserveditems") {
          collection.fetch();
        }
      }
      status.originatingView?.unblockActions?.();
    }
  });
  return UnreserveCommand;
});