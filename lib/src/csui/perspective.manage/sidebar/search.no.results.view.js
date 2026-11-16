/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/search.no.results" ], function(_, Marionette, lang, template) {
  "use strict";
  const NoSearchResultsView = Marionette.View.extend({
    className: "csui-empty-search-results",
    template: template,
    templateContext: function() {
      return {
        noWidgetsFound: lang.noWidgetsFound
      };
    },
    onRender: function() {
      const noSearchResultsParent = document.querySelector(".csui-sidebar-slide-body .cs-module-list");
      noSearchResultsParent.appendChild(this.el);
    }
  });
  return NoSearchResultsView;
});