/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "d2/server.adaptors/converters/landingpage", "d2/utils/landingpage/default.widget.types.map", "d2/utils/landingpage/tiles", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/widget.constants", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function(require, _, landingPageConverter, defWidgetTypesMap, tileDefinitions, RestResources, utils, widgetConstants, lang) {
  "use strict";
  var defWidgetMap = defWidgetTypesMap.getMaps(), widgetMap = {}, shortcutMap = {};
  var _resolveLPTileDefinitionsAndCreateRequiredWidgetsMap = function(landingPage) {
    var map = {}, defaultWidgets = landingPage.defaultWidgets, enableWidget = function(wType, wName) {
      map[wType + "~" + wName] = true;
    };
    _.each(landingPage.layout.options.widgets, function(wConfig) {
      var tileDef = widgetMap[wConfig.type] || tileDefinitions.findWidgetByType(wConfig.type);
      if (tileDef) {
        widgetMap[wConfig.type] = tileDef;
        if (wConfig.options && wConfig.options.widgetName) {
          enableWidget(wConfig.type, wConfig.options.widgetName);
        } else {
          _.extend(wConfig.options, {
            message: lang.itemCannotbeAccessed,
            title: _.str.sformat(tileDef.get("errMissingWidgetName"), wConfig.type)
          });
          wConfig.type = widgetConstants.SMARTUI.ERROR;
        }
      } else if (wConfig.type === widgetConstants.SMARTUI.SHORTCUTS) {
        if (wConfig.options && wConfig.options.shortcutItems) {
          _.each(wConfig.options.shortcutItems, function(item) {
            tileDef = shortcutMap[item.options.type] || tileDefinitions.findShortcutByType(item.options.type);
            if (tileDef) {
              shortcutMap[item.options.type] = tileDef;
              if (tileDef.requiresWidgetConfig()) {
                if (item.options && item.options.widgetName) {
                  enableWidget(item.options.type, item.options.widgetName);
                } else {
                  item.options.error = {
                    message: lang.itemCannotbeAccessed,
                    title: _.str.sformat(tileDef.get("errMissingWidgetName"), item.options.type)
                  };
                }
              }
            } else {
              item.options.error = {
                message: _.str.sformat(lang.missingTileMapMessage, item.options.type),
                title: _.str.sformat(lang.missingTileMapTitleShortcut, item.options.type),
                suggestion: lang.missingTileMapSuggestion
              };
            }
          });
        }
      } else {
        _.extend(wConfig.options, {
          message: _.str.sformat(lang.missingTileMapMessage, wConfig.type),
          title: _.str.sformat(lang.missingTileMapTitleWidget, wConfig.type),
          suggestion: lang.missingTileMapSuggestion
        });
        wConfig.type = widgetConstants.SMARTUI.ERROR;
      }
    });
    _.each(defWidgetMap, function(defMap, defName) {
      if (defaultWidgets[defName] && defaultWidgets[defName].widgetName) {
        enableWidget(defMap.type, defaultWidgets[defName].widgetName);
      }
    });
    if (utils.isMobile()) {
      if (!Array.isArray(landingPage.mobileMenu)) {
        landingPage.mobileMenu = [ landingPage.mobileMenu ];
      }
      _.each(landingPage.mobileMenu, function(menuItem) {
        if (widgetMap[menuItem.type]) {
          enableWidget(menuItem.type, menuItem.name);
        }
      });
    }
    return {
      widgetMap: map,
      landingPageConfig: landingPage.layout
    };
  }, _parseTitle = function(title) {
    if (!_.isEmpty(title)) {
      var user = RestResources.getCurrentUser().get("properties") || {};
      return title.replace(/\$user\.(\w*)/g, function(findString, attributeName) {
        return user[attributeName] || "";
      });
    }
  }, _convertWidgetParams = function(params) {
    var widgetParams = {};
    if (params) {
      _.each(params, function(item) {
        widgetParams[item.name] = item.value;
      });
    }
    return widgetParams;
  }, _parseMobileMenu = function(mobileMenuItems, widgetConfig) {
    mobileMenuItems = mobileMenuItems.filter(function(menuItem) {
      return widgetConfig[menuItem.type] && widgetConfig[menuItem.type][menuItem.name];
    });
    mobileMenuItems = _.unique(mobileMenuItems, function(menuItem) {
      return menuItem.name + "~" + menuItem.type;
    });
    mobileMenuItems.forEach(function(menuItem) {
      menuItem.title = widgetConfig[menuItem.type][menuItem.name].label_value;
      menuItem.type = widgetMap[menuItem.type].getResolvedTileType();
      menuItem.widgetName = menuItem.name;
    });
    return mobileMenuItems;
  };
  return {
    processLandingPageWidgets: function(landingPageEntry, widgetConfigEntries) {
      var lpWidgets, landingPage = landingPageConverter.convertLandingPage(landingPageEntry.landing_page_data, landingPageEntry.r_object_id);
      if (landingPageEntry.properties.default_skin) {
        landingPage.settings["default-skin"] = landingPageEntry.properties.default_skin;
      }
      lpWidgets = _resolveLPTileDefinitionsAndCreateRequiredWidgetsMap(landingPage);
      var widgetConfigs = {};
      _.each(widgetConfigEntries, function(entry) {
        var obj = entry.content.properties;
        var wType = obj.widget_type;
        var wName = obj.object_name;
        if (lpWidgets.widgetMap[wType + "~" + wName] === true || (wType === widgetConstants.D2.BRAVAIV || wType === widgetConstants.D2.BRAVAENTERPRISE || wType === widgetConstants.D2.BRAVACSR)) {
          if (obj.widget_params) {
            var widgetParams = _convertWidgetParams(obj.widget_params);
            delete obj.widget_params;
            obj.widgetParams = widgetParams;
          }
          obj.getParam = function(p) {
            var param = obj.widgetParams || {};
            return param[p];
          };
          widgetConfigs[wType] = widgetConfigs[wType] || {};
          widgetConfigs[wType][wName] = obj;
        }
      });
      RestResources.setWidgetConfigs(widgetConfigs);
      var widgets = lpWidgets.landingPageConfig.options.widgets, setTileError = function(tileDef, widget, errMsg, errTitle) {
        if (tileDef.isShortCut()) {
          widget.options.error = {
            message: errMsg,
            title: _.str.sformat(errTitle || "", widget.options.type)
          };
        } else {
          widget.options.message = errMsg;
          widget.options.title = _.str.sformat(errTitle || "", widget.type);
          widget.type = widgetConstants.SMARTUI.ERROR;
        }
      }, handleTile = function(tileDef, tile, wConfig) {
        tile.options = tile.options || {};
        if (tileDef.requiresWidgetConfig()) {
          if (wConfig) {
            var validation = tileDef.validateConfig(wConfig);
            if (!_.isNull(wConfig?.is_entitled) && !_.isUndefined(wConfig?.is_entitled) && wConfig?.is_entitled === false) {
              setTileError(tileDef, tile, lang.missingLicenseTileMapMessage, _.str.sformat(lang.missingLicenseTileTooltipMessage, wConfig.label_value));
              return;
            }
            if (!validation.status) {
              setTileError(tileDef, tile, lang.itemCannotbeAccessed, validation.errorMessage);
              return;
            }
            tile.options.widgetParams = _.deepClone(wConfig.widgetParams);
            tile.options.title = _parseTitle(wConfig.label_value);
          } else {
            setTileError(tileDef, tile, lang.itemCannotbeAccessed, tileDef.get("errMissingWidgetConfig"));
            return;
          }
        }
        tileDef.buildTileOptions(tile, wConfig);
        var defaultOptions = {
          icon: tileDef.get("icon"),
          applicationScope: tileDef.get("applicationScope")
        };
        if (wConfig) {
          defaultOptions.widgetType = wConfig["widget_type"];
          defaultOptions.widgetParams = _.deepClone(wConfig.widgetParams);
        }
        if (tileDef.isShortCut()) {
          defaultOptions.clickHandler = tileDef.get("clickHandler");
        } else {
          tile.type = tileDef.getResolvedTileType();
        }
        _.defaults(tile.options, defaultOptions);
        tileDef.setInUse();
      };
      _.each(widgets, function(w) {
        if (w.type !== widgetConstants.SMARTUI.ERROR) {
          var wConfig = widgetConfigs[w.type] && widgetConfigs[w.type][w.options.widgetName], tileDef = widgetMap[w.type];
          if (tileDef) {
            handleTile(tileDef, w, wConfig);
          } else if (w.type === widgetConstants.SMARTUI.SHORTCUTS) {
            if (w.options && w.options.shortcutItems) {
              _.each(w.options.shortcutItems, function(item) {
                if (!item.options.error) {
                  wConfig = widgetConfigs[item.options.type] && widgetConfigs[item.options.type][item.options.widgetName];
                  tileDef = shortcutMap[item.options.type];
                  handleTile(tileDef, item, wConfig);
                }
              });
            }
          }
        }
      });
      var defaultWidgets = landingPage.defaultWidgets, def = {}, getSetting = function(sName, noContent) {
        var s = landingPage.settings;
        if (noContent === true) {
          return s && s[sName] || undefined;
        } else {
          return s && s[sName] && s[sName].content;
        }
      }, settings = {
        searchFocusEnabled: getSetting("search-focus-header-enabled"),
        defaultSkin: getSetting("default-skin", true)
      }, err = [], srchConfig;
      _.each(defWidgetMap, function(defMap, defName) {
        var config;
        if (defaultWidgets[defName] && defaultWidgets[defName].widgetName) {
          config = widgetConfigs[defMap.type] && widgetConfigs[defMap.type][defaultWidgets[defName].widgetName];
        }
        if (config) {
          if (defMap.type === widgetConstants.D2.DOCLIST) {
            config.widgetParams = config.widgetParams || {};
            if (config.widgetParams.start_path_smartview !== "invalid_path") {
              def[defName] = defaultWidgets[defName].widgetName;
            }
            if (defName === widgetConstants.DEFAULT.SEARCH) {
              srchConfig = config;
            }
          } else {
            def[defName] = defaultWidgets[defName].widgetName;
          }
        } else if (defMap["errMissingWidgetConfig"]) {
          err.push(_.str.sformat(defMap["errMissingWidgetConfig"], defMap.type));
        }
      });
      var user = RestResources.getCurrentUser();
      user.set("settings", settings);
      if (err.length > 0) {
        throw err.join("\n");
      } else {
        user.perspective = lpWidgets.landingPageConfig;
        user.set("perspective", lpWidgets.landingPageConfig);
        user.set("defaultWidgets", def);
        if (utils.isMobile()) {
          var mobileAppMenu = _parseMobileMenu(landingPage.mobileMenu, widgetConfigs);
          user.set("mobileMenu", mobileAppMenu);
        }
        var enableBreadcrumb = srchConfig && srchConfig.widgetParams.is_breadcrumb_enabled;
        window.csui.require.config({
          config: {
            "csui/widgets/search.results/search.results.view": {
              enableBreadcrumb: enableBreadcrumb === "true"
            }
          }
        });
      }
    }
  };
});