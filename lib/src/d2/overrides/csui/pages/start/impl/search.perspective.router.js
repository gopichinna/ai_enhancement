/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  require([ "csui/utils/contexts/factories/user", "csui/pages/start/impl/search.perspective.router" ], function(UserModelFactory, SearchPerspectiveRouter) {
    var oldRouteUrl = SearchPerspectiveRouter.prototype.routerURL;
    SearchPerspectiveRouter.prototype.routerURL = function(searchQuery) {
      if (searchQuery && searchQuery.has("forcePerspectiveChange")) {
        searchQuery.unset("forcePerspectiveChange", {
          silent: true
        });
      }
      return oldRouteUrl.apply(this, arguments);
    };
    SearchPerspectiveRouter.prototype.openSearchPerspective = function(path, query_string) {
      var name, parameters = _.reduce(path.split("/"), function(result, item) {
        if (name) {
          result[name] = item != null ? decodeURIComponent(item).trim() : "";
          name = undefined;
        } else {
          name = decodeURIComponent(item);
        }
        return result;
      }, {});
      this.activate(false);
      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, true);
      }
      this._updateSearchQueryPageTitle();
      this._updateSearchFormQueryPageTitle();
      var user = this.context.getModel(UserModelFactory);
      user.ensureFetched().then(_.bind(function() {
        if (!(this.searchQuery && this.searchQuery.has("forcePerspectiveChange"))) {
          this.searchQuery.clear({
            silent: true
          });
        }
        this.searchQuery.set(parameters, {
          silent: !!this.searchQuery.get("query_id")
        });
        if (this.searchForm.get("query_id")) {
          this.searchForm.set(parameters, {
            silent: !!this.searchForm.get("query_id")
          });
        }
      }, this));
    };
  });
});