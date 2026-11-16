/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/query.form/impl/query.form.header", "i18n!d2/controls/query.form/impl/nls/lang" ], function(_, Marionette, template, lang) {
  var QueryFormHeaderView = Marionette.ItemView.extend({
    template: template,
    constructor: function QueryFormHeaderView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    events: {
      "click .cs-close": "onClickClose"
    },
    templateHelpers: function() {
      return {
        showClose: this.options.fromLandingPage,
        title: this.options.savedSearchName,
        close: lang.close
      };
    },
    onClickClose: function() {
      this.options.parent.triggerMethod("query:form:close");
    }
  });
  return QueryFormHeaderView;
});