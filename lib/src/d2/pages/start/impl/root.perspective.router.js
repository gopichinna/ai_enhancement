/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/pages/start/perspective.router", "d2/utils/root.perspective.utils", "d2/utils/widgets.utils", "i18n!d2/pages/start/impl/nls/lang", "i18n!csui/pages/start/nls/lang" ], function(_, $, Url, PerspectiveRouter, rootPerspectiveUtils, widgetUtils, lang, publicLang) {
  "use strict";
  return PerspectiveRouter.extend({
    name: "D2Root",
    constructor: function RootPerspectiveRouter() {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);
      _.each(rootPerspectiveUtils.getSupportedPerspectiveScopes(), function(scope) {
        this.route(scope, this.name, this.openApplicationScope.bind(this, scope));
        this.route(scope + "(?*query_string)", this.name, this.openApplicationScope.bind(this, scope));
      }.bind(this));
      this.listenTo(this.applicationScope, "change:id", this._updateUrl);
    },
    openApplicationScope: function(scope, query_string) {
      var routerInfo = this.context.viewStateModel.getLastHistoryEntry(), routerScopeId = routerInfo && routerInfo.scopeId, widgetName, page;
      if (!query_string || query_string.indexOf("widget_name") < 0) {
        if (routerScopeId === scope && routerInfo.state && routerInfo.state.widget_name) {
          widgetName = routerInfo.state.widget_name;
        } else {
          widgetName = this.getDefaultWidgetInQueryString(scope);
        }
        if (widgetName) {
          query_string = this.setWidgetInQueryString(query_string, widgetName);
        }
      }
      if (!query_string || query_string.indexOf("page") < 0) {
        if (this.restoring && routerScopeId === scope && routerInfo.state && routerInfo.state.page) {
          page = routerInfo.state.page;
        }
        query_string = this.setPropertyInQueryString(query_string, "page", page);
      }
      if (this.restoring && query_string && routerInfo && routerInfo.state && routerScopeId === scope) {
        var urlParamList = _.isFunction(this.getUrlParametersList) && this.getUrlParametersList();
        if (!urlParamList) {
          urlParamList = widgetUtils.getDefaultUrlParamsList();
        }
        if (urlParamList && urlParamList.length > 0) {
          _.each(urlParamList, _.bind(function(urlParam) {
            if (query_string.indexOf(urlParam) < 0 && routerInfo.state[urlParam]) {
              var urlParamValue = routerInfo.state[urlParam];
              query_string = this.setPropertyInQueryString(query_string, urlParam, urlParamValue);
            }
          }, this));
        }
      }
      this.activate(false);
      this.initViewStateFromUrlParams(query_string, this.restoring);
      this._updatePageTitle();
      this.applicationScope.set("id", scope);
    },
    getDefaultWidgetInQueryString: function(scope) {
      return rootPerspectiveUtils.getDefaultWidgetNameForScope(scope);
    },
    setWidgetInQueryString: function(query_string, widgetName) {
      return this.setPropertyInQueryString(query_string, "widget_name", widgetName);
    },
    setPropertyInQueryString: function(query_string, propName, propValue) {
      var queryParams = {};
      queryParams[propName] = propValue;
      if (query_string && query_string.indexOf(propName) < 0) {
        _.extend(queryParams, $.parseParams(query_string));
      }
      query_string = Url.combineQueryString(queryParams);
      return query_string;
    },
    isViewStateModelSupported: function() {
      return true;
    },
    initSessionViewState: function() {
      this._updateSessionState();
    },
    _updateSessionState: function() {
      var viewStateModel = this.context && this.context.viewStateModel;
      if (viewStateModel) {
        var newSessionState = {};
        _.extend(newSessionState, viewStateModel.get(viewStateModel.CONSTANTS.SESSION_STATE));
        viewStateModel.unset(viewStateModel.CONSTANTS.SESSION_STATE, {
          silent: true
        });
        viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, newSessionState);
      }
    },
    onOtherRoute: function() {
      if (this.isViewStateModelOwner) {
        var viewStateModel = this.context.viewStateModel;
        viewStateModel && viewStateModel.unset(viewStateModel.CONSTANTS.URL_PARAMS) && viewStateModel.unset(viewStateModel.CONSTANTS.QUERY_STRING_PARAMS);
        this.isViewStateModelOwner = false;
      }
    },
    onViewStateChanged: function() {
      this._updateUrl();
    },
    _updateUrl: function() {
      var scope = this.applicationScope.id, viewStateModel = this.context.viewStateModel, restored = this.restoring;
      if (rootPerspectiveUtils.hasScope(scope)) {
        if (this !== this.getActiveRouter()) {
          var state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {}, urlParamList = _.isFunction(this.getUrlParametersList) && this.getUrlParametersList();
          if (!urlParamList) {
            urlParamList = widgetUtils.getDefaultUrlParamsList();
          }
          state = _.extend({}, _.pick(state, urlParamList));
          this.activate(true);
          viewStateModel.set(viewStateModel.CONSTANTS.STATE, state, {
            silent: true
          });
        }
        this._updatePageTitle();
        this.navigate(scope);
        viewStateModel.set(viewStateModel.CONSTANTS.BACK_TO_TITLE, this.getBackToTitle());
        if (restored && viewStateModel.getLastHistoryEntry()) {
          restored = false;
          viewStateModel.set(viewStateModel.CONSTANTS.LAST_ROUTER, viewStateModel.getLastHistoryEntry().router);
        }
        this.isViewStateModelOwner = true;
      }
    },
    _updatePageTitle: function() {
      var widgetTitle = rootPerspectiveUtils.getWidgetTitleForScope(this.applicationScope.id, this.context);
      document.title = widgetTitle && _.str.sformat(lang.WidgetTitle, widgetTitle, publicLang.ProductName);
    },
    getBackToTitle: function() {
      var widgetTitle = rootPerspectiveUtils.getWidgetTitleForScope(this.applicationScope.id, this.context);
      return widgetTitle;
    }
  });
});