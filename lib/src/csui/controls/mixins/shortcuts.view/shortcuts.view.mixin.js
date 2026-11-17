/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/contexts/factories/node" ], function(_, NodeModel) {
  "use strict";
  var ShortcutsViewMixin = {
    createListForShortcutNodes: function(shortcutItems) {
      const modelPromiseList = [];
      Array.isArray(shortcutItems) && shortcutItems.forEach(shortcutItem => {
        const node = this.createMainNode(shortcutItem);
        shortcutItem.node = node;
        modelPromiseList.push(shortcutItem.node.fetch({
          suppressError: true
        }));
      });
      return modelPromiseList;
    },
    createDetailListForShortcuts: function(shortcutItems) {
      const backgroundImagePromiseList = [];
      Array.isArray(shortcutItems) && shortcutItems.forEach(shortcutItem => {
        const backgroundImageNode = this.createNode4BackgroundImage(shortcutItem.customBackgroundImage);
        backgroundImageNode && backgroundImagePromiseList.push(backgroundImageNode.fetch({
          suppressError: true
        }));
      });
      return backgroundImagePromiseList;
    },
    createMainNode: function(shortcutItem) {
      return this.options.context.getModel(NodeModel, {
        attributes: {
          id: shortcutItem.id || shortcutItem.launchButtonID || "volume",
          type: shortcutItem.type
        },
        options: {
          fields: {
            properties: [ "container", "id", "name", "original_id", "type", "custom_view_search", "image_url" ],
            "versions.element(0)": [ "mime_type" ]
          }
        }
      });
    },
    createNode4BackgroundImage: function(backgroundImageNodeId) {
      if (!backgroundImageNodeId) return;
      return this.options.context.getModel(NodeModel, {
        attributes: {
          id: backgroundImageNodeId
        },
        options: {
          fields: {
            properties: [ "deploy_url", "mime_type", "modify_date", "name", "id" ],
            "versions.element(0)": [ "owner_id", "version_number" ],
            nicknames: [ "nickname" ]
          }
        }
      });
    }
  };
  return ShortcutsViewMixin;
});