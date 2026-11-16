/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "csui/utils/node.links/node.links", "dctmw/utils/constants", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, CommandHelper, nodeLinks, constants, utils, lang) {
  "use strict";
  const GoToLocation = CommandModel.extend({
    defaults: {
      signature: "Aviator-GoToLocation",
      command_key: "Aviator-GoToLocation",
      name: lang.CommandAviatorGotoLocation,
      scope: "single"
    },
    enabled: function(status, options) {
      const node = CommandHelper.getJustOneNode(status);
      const type = node && node.get("type");
      return (type === constants.Types.CABINET || type === constants.Types.FOLDER) && CommandModel.prototype.enabled.call(this, status, options);
    },
    execute: function(status, options) {
      const opts = _.extend({}, status, options);
      let node = CommandHelper.getJustOneNode(status);
      if (opts.openParentLocation === true) {
        node = node.parent;
      }
      const url = node && nodeLinks.getUrl(node);
      const openInNewTab = opts.newTab !== false;
      const winName = opts.windowName || "_blank";
      const winFeatures = opts.windowFeatures || "";
      utils.openUrlInWindow(url, openInNewTab ? window.open("", winName, winFeatures) : null, true, true);
      return $.Deferred().resolve().promise();
    }
  });
  return GoToLocation;
});