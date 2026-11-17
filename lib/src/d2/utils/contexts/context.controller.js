/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/contexts/factories/connector", "dctmw/utils/rest.resources", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils" ], function(require, $, Backbone, ConnectorFactory, RestResources, constants, widgetConstants, utils) {
  "use strict";
  var NodesTableView, ShortcutView, MobileInfiniteListItemView;
  var WIDGET_INFO = "widgetInfo", PREFERRED_WIDGET_INFO = "preferredWidgetInfo", FORCE_DEFAULT_DOCLIST_WIDGET_INFO = "forceDefaultDoclistWidget", BREADCRUMB_ROOT = "breadcrumbRoot", TREE_STATE = "treeState";
  return {
    init: function(context) {
      if (!this._initStorage()) {
        return;
      }
      this.context = context;
      this.currentWidgetInfo = {};
      if (context._applicationScope) {
        context.on("change:perspective", function() {
          if (!context._applicationScope.id || context._applicationScope.id === "queryform") {
            this.removeWidgetInfo();
            this.namedSessionStorage.remove(BREADCRUMB_ROOT);
            this.namedSessionStorage.remove(TREE_STATE);
            this._prepareSavedSearchFactory(context);
          }
        }, this);
        context.on("request", function() {
          if (!context._applicationScope.id || context._applicationScope.id === "queryform") {
            this._fetchSavedSearchFactory(context);
          }
        }.bind(this));
      }
      context.on("context:change", function() {
        this.namedSessionStorage && this.namedSessionStorage.destroy();
      }, this);
      var deferred = $.Deferred();
      require(utils.isMobile() ? [ "mobile/widgets/nodestable/nodestable.view", "d2mob/widgets/mobile.shortcut/shortcut.view", "mobile/controls/infinite.list/infinite.list.item.view" ] : [ "csui/widgets/nodestable/nodestable.view", "d2/widgets/shortcut/shortcut.view" ], function() {
        NodesTableView = arguments[0];
        ShortcutView = arguments[1];
        MobileInfiniteListItemView = arguments[2];
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },
    getContext: function() {
      return this.context;
    },
    setForceDefaultDocListWidget: function() {
      if (this._initStorage()) {
        this.namedSessionStorage.set(FORCE_DEFAULT_DOCLIST_WIDGET_INFO, true);
      }
    },
    removeForceDefaultDocListWidget: function() {
      if (this._initStorage()) {
        this.namedSessionStorage.remove(FORCE_DEFAULT_DOCLIST_WIDGET_INFO);
      }
    },
    setWidgetInfo: function(view, widgetInfo) {
      if (!this._initStorage()) {
        return;
      }
      if (view) {
        if (view instanceof ShortcutView) {
          this.namedSessionStorage.set(WIDGET_INFO, {
            name: view.widgetName,
            type: view.widgetType
          });
        } else if (!(view instanceof NodesTableView || MobileInfiniteListItemView && view instanceof MobileInfiniteListItemView)) {
          this.removeWidgetInfo();
        }
      } else if (widgetInfo) {
        this.namedSessionStorage.set(WIDGET_INFO, {
          name: widgetInfo.name,
          type: widgetInfo.type
        });
      }
    },
    getWidgetInfo: function(options = {}) {
      if (!this._initStorage()) {
        return;
      }
      let defaultWidgetInfo = {
        name: this.browseDoclistWidget,
        type: widgetConstants.D2.DOCLIST
      };
      if (this.namedSessionStorage.get(FORCE_DEFAULT_DOCLIST_WIDGET_INFO) === true) {
        return defaultWidgetInfo;
      }
      if (options.skipPreferredWidget === true) {
        return this.namedSessionStorage.get(WIDGET_INFO) || defaultWidgetInfo;
      }
      return this.namedSessionStorage.get(PREFERRED_WIDGET_INFO) || this.namedSessionStorage.get(WIDGET_INFO) || defaultWidgetInfo;
    },
    removeWidgetInfo: function() {
      this.removePreferredWidgetInfo();
      if (this._initStorage()) {
        this.namedSessionStorage.remove(WIDGET_INFO);
      }
    },
    setPreferredWidgetInfo: function(widgetInfo) {
      if (!this._initStorage()) {
        return;
      }
      this.namedSessionStorage.set(PREFERRED_WIDGET_INFO, {
        name: widgetInfo.name,
        type: widgetInfo.type
      });
    },
    removePreferredWidgetInfo: function() {
      if (!this._initStorage()) {
        return;
      }
      this.namedSessionStorage.remove(PREFERRED_WIDGET_INFO);
    },
    setBreadcrumbRoot: function(roots) {
      if (!this._initStorage()) {
        return;
      }
      this.namedSessionStorage.set(BREADCRUMB_ROOT, roots);
    },
    getBreadcrumbRoot: function() {
      if (!this._initStorage()) {
        return;
      }
      return this.namedSessionStorage.get(BREADCRUMB_ROOT);
    },
    setTreeState: function(state) {
      if (!this._initStorage()) {
        return;
      }
      this.namedSessionStorage.set(TREE_STATE, state);
    },
    getTreeState: function() {
      if (!this._initStorage()) {
        return;
      }
      return this.namedSessionStorage.get(TREE_STATE);
    },
    _initStorage: function() {
      if (this.namedSessionStorage) {
        return true;
      }
      var currUser = RestResources.getCurrentUser();
      if (!currUser || !(currUser instanceof Backbone.Model)) {
        return false;
      }
      this.browseDoclistWidget = currUser.get("defaultWidgets")[widgetConstants.DEFAULT.DOCLIST];
      this.namedSessionStorage = utils.getSessionStore(constants.StorageKey.WIDGET_CONTEXT);
      return true;
    },
    _prepareSavedSearchFactory: function(context) {
      context.savedSearchPromise = $.Deferred();
    },
    _fetchSavedSearchFactory: function(context) {
      require([ "d2/widgets/savedsearch/savedsearch.groups.factory" ], function(SavedSearchGroupFactory) {
        if (context.hasModel(SavedSearchGroupFactory)) {
          var savedSearchGroupModel = context.getModel(SavedSearchGroupFactory);
          savedSearchGroupModel.fetch().done(context.savedSearchPromise.resolve).fail(context.savedSearchPromise.reject);
        } else {
          context.savedSearchPromise.reject("Unused factory");
        }
      }.bind(this), context.savedSearchPromise.reject);
    },
    getCurrentWidgetInfo: function(model) {
      if (model?.widgetDetails?.widgetType && model?.widgetDetails?.widgetName) {
        return model?.widgetDetails;
      } else {
        return this.currentWidgetInfo;
      }
    },
    setCurrentWidgetInfo: function(widgetInfo) {
      if (widgetInfo?.widgetType && widgetInfo?.widgetName) {
        this.currentWidgetInfo = widgetInfo;
      }
    }
  };
});