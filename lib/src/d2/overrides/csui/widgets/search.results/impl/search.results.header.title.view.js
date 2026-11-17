/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require" ], function(require) {
  "use strict";
  require([ "csui/widgets/search.results/impl/search.results.header.title.view", "i18n!csui/widgets/search.results/impl/nls/lang" ], function(SearchResultsHeaderTitleView, lang) {
    SearchResultsHeaderTitleView.prototype._updateSearchResultsTitle = function() {
      var searchHeaderTitle, tooltipText;
      if (!!this.options.useCustomTitle && !!this.title) {
        this.ui.customSearchTitle.text(this.title);
        tooltipText = lang.searchResults + ": " + this.title;
        searchHeaderTitle = lang.searchResults + ": ";
      } else {
        searchHeaderTitle = this.options.searchHeaderTitle;
        tooltipText = searchHeaderTitle;
      }
      this.ui.resultTitle.text(searchHeaderTitle);
      this.ui.resultTitle.parent().attr("title", tooltipText);
    };
  });
});