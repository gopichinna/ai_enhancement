/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/pages/start/perspective.router", "i18n!csui/pages/start/nls/lang", "csui/utils/contexts/factories/next.node" ], function(_, PerspectiveRouter, publicLang, NextNodeModelFactory) {
  "use strict";
  var applicationScopes = {
    myassignments: _.str.sformat(publicLang.MyAssignmentsTitle, publicLang.ProductName),
    recentlyaccessed: _.str.sformat(publicLang.RecentlyAccessedTitle, publicLang.ProductName),
    favorites: _.str.sformat(publicLang.FavoritesTitle, publicLang.ProductName),
    searchresults: _.str.sformat(publicLang.SearchResultsTitle, publicLang.ProductName),
    myreserveditems: _.str.sformat(publicLang.ReservedItemsTitle, publicLang.ProductName),
    recycleitems: _.str.sformat(publicLang.RecycleTitle, publicLang.ProductName)
  };
  var applicationScopesBackToTitle = {
    myassignments: publicLang.MyAssignmentsBackTo,
    recentlyaccessed: publicLang.RecentlyAccessedBackTo,
    favorites: publicLang.FavoritesBackTo,
    searchresults: publicLang.SearchResultsBackTo,
    myreserveditems: publicLang.ReservedItemsBackTo,
    recycleitems: publicLang.RecycleBackTo
  };
  var RootPerspectiveRouter = PerspectiveRouter.extend({
    name: "Root",
    routes: {
      myassignments: "openMyAssignmentsPerspective",
      "myassignments(?*query_string)": "openMyAssignmentsPerspective",
      recentlyaccessed: "openRecentlyAccessedPerspective",
      "recentlyaccessed(?*query_string)": "openRecentlyAccessedPerspective",
      favorites: "openFavoritesPerspective",
      "favorites(?*query_string)": "openFavoritesPerspective",
      "searchresults/:id": "openSearchResultsPerspective",
      "searchresults/:id(?*query_string)": "openSearchResultsPerspective",
      myreserveditems: "openReservedItemsPerspective",
      "myreserveditems(?*query_string)": "openReservedItemsPerspective",
      recycleitems: "openRecycleItemsPerspective",
      "recycleitems(?*query_string)": "openRecycleItemsPerspective"
    },
    constructor: function RootPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);
      this.listenTo(this.applicationScope, "change:id", this._updateUrl);
    },
    openRecentlyAccessedPerspective: function(query_string) {
      this.openApplicationScope("recentlyaccessed", query_string);
    },
    openMyAssignmentsPerspective: function(query_string) {
      this.openApplicationScope("myassignments", query_string);
    },
    openFavoritesPerspective: function(query_string) {
      this.openApplicationScope("favorites", query_string);
    },
    openSearchResultsPerspective: function(id, query_string) {
      id = parseInt(id);
      this.activate(false);
      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, id);
      }
      this._updatePageTitle();
      this.applicationScope.set("query_id", id);
      this.applicationScope.set("id", "searchresults");
    },
    openReservedItemsPerspective: function(query_string) {
      this.openApplicationScope("myreserveditems", query_string);
    },
    openRecycleItemsPerspective: function(query_string) {
      this.openApplicationScope("recycleitems", query_string);
    },
    openApplicationScope: function(scope, query_string) {
      this.activate(false);
      this.initViewStateFromUrlParams(query_string);
      this._updatePageTitle();
      this.applicationScope.set("id", scope);
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
    onViewStateChanged: function() {
      this._updateUrl();
    },
    restore: function(routerInfo) {
      this.applicationScope.set("id", routerInfo.scopeId);
    },
    _updateUrl: function() {
      var scope = this.applicationScope.id;
      if (applicationScopes[scope]) {
        if (this !== this.getActiveRouter()) {
          this.activate(true);
        }
        var query_id = this.applicationScope.get("query_id");
        if (query_id) {
          scope += "/" + query_id;
        }
        this._updatePageTitle();
        this.navigate(scope);
      }
    },
    _updatePageTitle: function() {
      if (!this.history.detached) {
        document.title = applicationScopes[this.applicationScope.id];
      }
    },
    getBackToTitle: function() {
      return applicationScopesBackToTitle[this.applicationScope.id];
    }
  });
  return RootPerspectiveRouter;
});