/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/controls/globalmessage/globalmessage", "csui/models/command", "nuc/utils/base", "csui/utils/commandhelper", "d2/utils/clipboard.manager", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/commands/nls/localized.strings" ], function($, _, GlobalMessage, CommandModel, base, CommandHelper, ClipboardManager, RestLinkrels, serverQueryUtils, constants, widgetConstants, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "Copy",
      command_key: "Copy",
      name: lang.CommandNameCopy,
      pageLeavingWarning: lang.CopyPageLeavingWarning,
      scope: "multiple"
    },
    execute: function(status) {
      var me = this, nodes = CommandHelper.getAtLeastOneNode(status), deferred = $.Deferred(), copyData = nodes.map(function(node) {
        var parentId = status.container && status.container.get("id") || node.get("i_folder_id");
        if (_.isArray(parentId)) {
          parentId = parentId[0];
        }
        return {
          nodeAttributes: _.clone(node.attributes),
          parentId: parentId
        };
      });
      if (!copyData || copyData.length === 0) {
        deferred.reject();
        GlobalMessage.showMessage("error", lang.CopyItemsNoneMessage);
      } else if (status.container && status.container.get("id")) {
        ClipboardManager.storeCopiedItems(copyData);
        serverQueryUtils.fetchActions({
          menuType: constants.MenuTypes.CONTEXT,
          widgetType: widgetConstants.D2.DOCLIST,
          ids: _.uniq(_.map(copyData, function(entry) {
            return entry.parentId;
          })),
          connector: status.container.connector
        }).done(function(nodeActions) {
          nodeActions = _.toArray(nodeActions);
          var permittedActions = nodeActions[0], origActions = status.collection ? status.collection.node.attributes.actions : status.container.attributes.actions;
          if (!status.collection) {
            status.container.attributes.actions = _.uniq(_.union(origActions, _.where(permittedActions, {
              signature: "D2-Paste"
            }), _.where(permittedActions, {
              signature: "D2-PasteAsLink"
            })), "signature");
          } else {
            status.collection.node.attributes.actions = _.uniq(_.union(origActions, _.where(permittedActions, {
              signature: "D2-Paste"
            }), _.where(permittedActions, {
              signature: "D2-PasteAsLink"
            })), "signature");
          }
          status.container.fetch({
            force: true,
            reload: true
          });
          me._showGlobalMessage(copyData);
        });
        deferred.resolve();
      } else {
        ClipboardManager.storeCopiedItems(copyData);
        me._showGlobalMessage(copyData);
        deferred.resolve();
      }
      return deferred.promise();
    },
    _showGlobalMessage: function(copyData) {
      var successMessage = copyData.length === 1 ? _.str.sformat(lang.CopyOneItemSuccessMessage, copyData[0].nodeAttributes.name) : _.str.sformat(lang.CopyManyItemsSuccessMessage, copyData.length);
      GlobalMessage.showMessage("success", successMessage, undefined, {});
    }
  });
});