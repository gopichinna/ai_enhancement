/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/query.form/impl/query.form.header", "i18n!d2/controls/query.form/impl/nls/lang" ], function(_, Marionette, template, lang) {
  var QueryFormHeaderView = Marionette.ItemView.extend({
    template: template,
    constructor: function QueryFormHeaderView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    regions: {
      newSearchRegion: ".queryform-header-view-new-search"
    },
    events: {
      "click .cs-close": "onClickClose",
      "click .queryform-header-view-new-search": "onClickNewSearch"
    },
    templateHelpers: function() {
      return {
        showClose: this.options.fromLandingPage,
        title: this.options.savedSearchName,
        allowNewSearchAction: this.options.allowNewSearchAction === true,
        newSearch: lang.newSearch,
        close: lang.close
      };
    },
    onClickNewSearch() {
      this.triggerMethod("query:form:new:search");
    },
    onClickClose: function() {
      this.options.parent.triggerMethod("query:form:close");
    }
  });
  return QueryFormHeaderView;
});