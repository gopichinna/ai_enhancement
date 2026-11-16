/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "d2/commands/go.back" ], function(require, _, CmdGoBack) {
  "use strict";
  require([ "csui/widgets/search.results/impl/search.results.header.view" ], function(SearchResultsHeaderView) {
    var proto = SearchResultsHeaderView.prototype, cmdGoBack = new CmdGoBack();
    _.extend(proto, {
      onClickBack: function(event) {
        var viewStateModel = this.context && this.context.viewStateModel, activeRoute = viewStateModel && viewStateModel.get("activeRouterInstance"), searchQuery = activeRoute && activeRoute.searchQuery, savedSearchId = searchQuery && searchQuery.get("by-id"), navigationHistory = viewStateModel && viewStateModel.get("navigationHistoryArray"), currentRouterFragment = viewStateModel && viewStateModel.get("currentRouterFragment");
        searchQuery && searchQuery.clear({
          silent: true
        });
        event && event.stopPropagation();
        var commandOptions = {
          context: this.context,
          restoreLastFragment: true
        }, savedSearchUrlRegex = new RegExp("search/(by-id|queryform)/[a-f0-9]{16,}");
        if (!!savedSearchId && currentRouterFragment && savedSearchUrlRegex.test(currentRouterFragment)) {
          for (var i = navigationHistory.length - 1; i >= 0; i--) {
            var historyItem = navigationHistory[i], match = savedSearchUrlRegex.test(historyItem.fragment);
            if (!match) {
              commandOptions.restoryHistoryIndex = i;
              break;
            }
          }
        }
        cmdGoBack.execute(commandOptions);
      },
      _createExportView: function() {}
    });
  });
});