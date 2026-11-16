/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.plugins/open.plugins" ], function(openPlugins) {
  "use strict";
  var docPreviewPlugins = openPlugins.clone();
  docPreviewPlugins.reset(docPreviewPlugins.filter(function(rule) {
    return rule.get("plugin").isPreviewPlugin === true;
  }));
  var origFindByNode = docPreviewPlugins.findByNode;
  docPreviewPlugins.findByNode = function(node, options) {
    var plugin;
    if (node) {
      node.forcePreview = true;
      plugin = origFindByNode.call(this, node, options);
      delete node.forcePreview;
    }
    return plugin;
  };
  docPreviewPlugins.findAtLeastOneByNode = function(node, options) {
    var plugin = this.findByNode(node, options);
    if (!plugin) {
      plugin = this.length ? this.last().get("plugin") : undefined;
    }
    return plugin;
  };
  return docPreviewPlugins;
});