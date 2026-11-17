/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/models/command", "csui/controls/treebrowse/navigation.tree", "i18n!csui/utils/commands/nls/lang" ], function($, _, CommandModel, NavigationTree, lang) {
  "use strict";
  var TreeBrowseCommand = CommandModel.extend({
    defaults: {
      signature: "TreeBrowse",
      scope: "single"
    },
    enabled: function(status, options) {
      var showTree = status && status.originatingView && status.originatingView.showTree;
      if (showTree === true && status.toolItem) {
        status.toolItem.set({
          title: lang.TreeBrowseCollapseTooltip,
          toolItemAriaExpand: true,
          stateIsOn: true
        });
      }
      return NavigationTree.enabled(status, options);
    }
  });
  return TreeBrowseCommand;
});