/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/utils/server.query.utils", "d2/utils/perspectives/app.scope.perspectives" ], function(_, RestResources, widgetConstants, serverQueryUtils, appScopePerspectives) {
  "use strict";
  var getAvailableScopes = function() {
    var supportedPerspectiveScopes = {};
    return function() {
      if (_.isEmpty(supportedPerspectiveScopes)) {
        _.each(appScopePerspectives.getActiveApplicationScopeModels(), function(m) {
          supportedPerspectiveScopes[m.get("applicationScope")] = m;
        });
      }
      return supportedPerspectiveScopes;
    };
  }();
  return {
    getSupportedPerspectiveScopes: function() {
      return _.keys(getAvailableScopes());
    },
    hasScope: function(scope) {
      return scope && getAvailableScopes()[scope];
    },
    getDefaultWidgetNameForScope: function(scope) {
      var defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), perspectiveScope = getAvailableScopes()[scope];
      return perspectiveScope && defaultWidgets[perspectiveScope.getDefaultWidgetType()];
    },
    getWidgetConfigForScope: function(scope, context) {
      if (this.hasScope(scope)) {
        var perspectiveScope = getAvailableScopes()[scope], viewStateModel = context && context.viewStateModel, widgetType = perspectiveScope.getWidgetType(), widgetName = viewStateModel && viewStateModel.getViewState("widget_name");
        return widgetName && widgetType && serverQueryUtils.getWidgetConfig(widgetType, widgetName);
      }
    },
    getDefaultWidgetConfigForScope: function(scope, context) {
      if (this.hasScope(scope) && context && context.viewStateModel) {
        var perspectiveScope = getAvailableScopes()[scope], widgetType = perspectiveScope.getWidgetType();
        if (perspectiveScope.getDefaultWidgetType() && context.viewStateModel.get("currentRouterScopeId") !== scope) {
          var widgetName = this.getDefaultWidgetNameForScope(scope);
          if (widgetName) {
            context.viewStateModel.setViewState("widget_name", widgetName, {
              silent: true
            });
            return serverQueryUtils.getWidgetConfig(widgetType, widgetName);
          }
        }
      }
    },
    getWidgetTitleForScope: function(scope, context) {
      if (this.hasScope(scope)) {
        var perspectiveScope = getAvailableScopes()[scope], widgetConfig = this.getWidgetConfigForScope(scope, context);
        return widgetConfig && widgetConfig.label_value || perspectiveScope.getTitle();
      }
    },
    validateConfigForScope: function(scope) {
      Array.prototype.splice.call(arguments, 0, 1);
      return this.hasScope(scope) && getAvailableScopes()[scope].validateConfig.apply(getAvailableScopes()[scope], arguments);
    },
    getPerspectiveJsonForScope: function(scope) {
      return this.hasScope(scope) && getAvailableScopes()[scope].getPerspectiveJson();
    },
    notifyActivationForScope: function(scope) {
      return this.hasScope(scope) && getAvailableScopes()[scope].applyBeforeActivateHook();
    },
    notifyDeactivationOfOtherScopes: function(enabledScope) {
      var scopeMaps = getAvailableScopes(), allOtherScopes = _.without(this.getSupportedPerspectiveScopes(), enabledScope);
      _.each(allOtherScopes, function(scope) {
        scopeMaps[scope].applyAfterDeactivateHook();
      });
    }
  };
});