/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/constants", "csui/models/command", "csui/utils/commandhelper", "d2/utils/server.query.utils", "d2/utils/widget.constants", "dctmw/utils/client.location" ], function(require, _, $, constants, CommandModel, CommandHelper, serverQueryUtils, widgetConstants, clientLocation) {
  "use strict";
  const DirectViewLink = CommandModel.extend({
    defaults: {
      signature: "D2-DirectView",
      command_key: "D2-DirectView",
      scope: "single"
    },
    enabled: function(status) {
      if (status && status.context && status.context.isEmbeddedMode === true) {
        return false;
      }
      var node = CommandHelper.getJustOneNode(status), enable = false, viewer = status.data && status.data.viewer ? status.data.viewer : "";
      if (node && status.nodes.length === 1) {
        enable = _.contains([ constants.Types.DOCUMENT ], node.get("type"));
        if (enable && !_.isEmpty(viewer)) {
          if (!(serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVACSR, viewer) || serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAENTERPRISE, viewer) || serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, viewer))) {
            enable = false;
          }
        }
      }
      return enable;
    },
    execute: function(status) {
      var viewer = status.data && status.data.viewer ? status.data.viewer : "";
      const dfd = $.Deferred();
      var link = document.createElement("a");
      link.target = "_blank";
      if (viewer) {
        link.href = clientLocation.modularizeFragment(`viewer?node=${status.nodes.at(0).get("id")}&viewer-name=${viewer}`);
      } else {
        link.href = clientLocation.modularizeFragment(`viewer?node=${status.nodes.at(0).get("id")}`);
      }
      link.click();
      return dfd.resolve().promise();
    }
  });
  return DirectViewLink;
});