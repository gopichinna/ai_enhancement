/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/widget.constants", "d2/utils/landingpage/tiles" ], function(_, widgetConstants, tileDefinitions) {
  "use strict";
  var SHORTCUT_TILE_NON_WIDGET_TYPES = _.map(tileDefinitions.findAllNonWidgetShortcuts() || [], function(tileModel) {
    return tileModel.get("type");
  }), getDefaultWidgetTypeFromTag = function(tagName) {
    return tagName.replace(/[^\w]/g, "");
  };
  return {
    convertLandingPage: function(response, landingPageId) {
      var page = {
        layout: {
          type: "flow",
          options: {
            widgets: []
          }
        },
        defaultWidgets: {}
      }, layout = response.root.space["flow-layout-container"] && response.root.space["flow-layout-container"].content || {}, defaultWidgets = response.root["default-widgets"], widgetTiles = layout["widget-container"], tileContainers = layout["tile-container"], widgets = {};
      page.mobileMenu = response.root["mobile-menu"] && response.root["mobile-menu"]["menu-item"] || [];
      page.settings = response.root["settings"];
      _.each(defaultWidgets, function(w, tagName) {
        if (_.isObject(w) && w.content) {
          page.defaultWidgets[getDefaultWidgetTypeFromTag(tagName)] = {
            widgetName: w.content
          };
        }
      });
      widgetTiles = widgetTiles || [];
      if (!_.isArray(widgetTiles)) {
        widgetTiles = [ widgetTiles ];
      }
      _.each(widgetTiles, function(wTile) {
        if (wTile.widget) {
          widgets[wTile.order] = {
            type: wTile.widget.type,
            options: {
              widgetName: wTile.widget.name
            }
          };
        }
      });
      tileContainers = tileContainers || [];
      if (!_.isArray(tileContainers)) {
        tileContainers = [ tileContainers ];
      }
      _.each(tileContainers, function(container) {
        var items = {}, shortcutItems = [], tiles = container.tile || container["action-tile"];
        if (tiles) {
          if (!_.isArray(tiles)) {
            tiles = [ tiles ];
          }
          _.each(tiles, function(tile) {
            if (tile.name && SHORTCUT_TILE_NON_WIDGET_TYPES.indexOf(tile.type) === -1) {
              tile.widgetName = tile.name;
              delete tile.name;
            }
            tile.landingPageId = landingPageId;
            items[tile.order] = {
              options: tile
            };
          });
          if (items.length === 1) {
            shortcutItems.push(items[0]);
          } else {
            var keys = _.keys(items).sort();
            _.each(keys, function(key) {
              shortcutItems.push(items[key]);
            });
          }
          widgets[container.order] = {
            type: widgetConstants.SMARTUI.SHORTCUTS,
            kind: "tile",
            options: {
              shortcutItems: shortcutItems
            }
          };
        }
      });
      var keys = _.keys(widgets).sort(function(a, b) {
        return a - b;
      });
      _.each(keys, function(key) {
        page.layout.options.widgets.push(widgets[key]);
      });
      return page;
    }
  };
});