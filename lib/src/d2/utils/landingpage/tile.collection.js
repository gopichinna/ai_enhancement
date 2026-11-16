/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n!d2/server.adaptors/models/impl/nls/lang", "d2/utils/widget.constants", "dctmw/utils/rule.matcher.collection" ], function(_, lang, widgetConstants, RuleMatcherCollection) {
  "use strict";
  var RuleMatcherModel = RuleMatcherCollection.prototype.model;
  var TileModel = RuleMatcherModel.extend({
    defaults: {
      _srcNS: "d2",
      type: "Unknown",
      sequence: 1e3,
      isInUse: false,
      isShortcut: false,
      tileConfigType: widgetConstants.TileConfigTypes.WIDGET,
      validateConfig: function() {
        return {
          status: true
        };
      },
      errMissingWidgetName: lang.customWidgetNameMissing,
      errMissingWidgetConfig: lang.customWidgetMissing
    },
    constructor: function TileModel() {
      RuleMatcherModel.apply(this, arguments);
    },
    isShortCut: function() {
      return this.get("isShortcut") === true;
    },
    validateConfig: function() {
      var validator = this.get("validateConfig"), validationResult = {
        status: true
      };
      try {
        if (_.isFunction(validator)) {
          _.extend(validationResult, validator.apply(this, arguments));
        }
      } catch (e) {
        console.error(e);
        validationResult = {
          status: false,
          errorMessage: e.message
        };
      }
      return validationResult;
    },
    buildTileOptions: function() {
      var viewOptionsBuilder = _.isFunction(this.get("buildTileOptions")) ? this.get("buildTileOptions") : _.noop;
      try {
        return viewOptionsBuilder.apply(this, arguments);
      } catch (e) {
        console.error(e);
      }
    },
    requiresWidgetConfig: function() {
      return this.get("tileConfigType") === widgetConstants.TileConfigTypes.WIDGET;
    },
    getResolvedTileType: function() {
      var tileView = this.get("tileView") || this.get("type") || "Unknown";
      if (tileView.indexOf("/") === -1) {
        tileView = this.get("_srcNS") + "/widgets/" + tileView.toLowerCase();
        this.set("tileView", tileView, {
          silent: true
        });
      }
      return tileView;
    },
    setInUse: function() {
      this.set("isInUse", true, {
        silent: true
      });
    },
    setNotInUse: function() {
      this.set("isInUse", false, {
        silent: true
      });
    }
  });
  var TileCollection = RuleMatcherCollection.extend({
    model: TileModel,
    comparator: "sequence",
    findAllNonWidgetShortcuts: function() {
      return this.findAllByRule({
        and: [ {
          equals: {
            isShortcut: true
          }
        }, {
          not: {
            equals: {
              tileConfigType: widgetConstants.TileConfigTypes.WIDGET
            }
          }
        } ]
      });
    },
    findByType: function(type, isShortcut) {
      isShortcut = !!isShortcut;
      return this.findByRule({
        and: [ {
          equals: {
            type: type
          }
        }, {
          equals: {
            isShortcut: isShortcut
          }
        } ]
      });
    },
    findShortcutByType: function(type) {
      return this.findByType(type, true);
    },
    findWidgetByType: function(type) {
      return this.findByType(type, false);
    }
  });
  return TileCollection;
});