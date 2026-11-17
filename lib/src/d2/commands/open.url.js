/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "nuc/models/nodes", "csui/utils/commandhelper", "d2/utils/constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, NodeCollection, CommandHelper, constants, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-OpenUrl",
      command_key: "D2-OpenUrl",
      name: lang.CommandNameOpenUrl,
      scope: "single"
    },
    enabled: function(status, options) {
      var menuType;
      if (status.toolItem) {
        var props = status.toolItem.get("actionProperties");
        menuType = props && props.menuType;
      }
      if (menuType === constants.MenuTypes.USER) {
        return true;
      } else if (menuType === constants.MenuTypes.NEW_OBJECT) {
        var nodes = new NodeCollection([ status.container ]), newStatus = _.defaults({
          nodes: nodes
        }, status);
        return CommandModel.prototype.enabled.call(this, newStatus, options);
      } else {
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
    },
    execute: function(status) {
      var deferred = $.Deferred(), menuType, node, action, cmdData;
      if (status.toolItem) {
        var props = status.toolItem.get("actionProperties");
        menuType = props && props.menuType;
      }
      if (menuType === constants.MenuTypes.USER) {
        cmdData = status.data;
      } else {
        node = menuType === constants.MenuTypes.NEW_OBJECT ? status.container : CommandHelper.getJustOneNode(status);
        if (node) {
          action = CommandHelper.getOriginalAction(node, this.get("signature"), status.data);
          if (action) {
            cmdData = action.get("commandData");
          }
        }
        if (!cmdData) {
          return deferred.reject();
        }
      }
      var winName = cmdData.windowName || "_blank", winFeatures = cmdData.windowFeatures || "", url = cmdData.url || cmdData.URL;
      utils.openUrlInWindow(url, window.open("", winName, winFeatures), true, true);
      return deferred.resolve();
    }
  });
});