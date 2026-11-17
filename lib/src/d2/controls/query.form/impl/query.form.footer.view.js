/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/behaviors/overflow.footer.button.behavior", "i18n!d2/controls/query.form/impl/nls/lang", "hbs!d2/controls/query.form/impl/query.form.footer" ], function(_, Marionette, OverflowFooterButtonBehavior, lang, template) {
  var QueryFormFooterView = Marionette.ItemView.extend({
    template: template,
    ui: {
      searchbtn: ".d2-otc-btn.form-btn.search"
    },
    className: "queryformbtn",
    events: {
      "click .search": "onClickSearch",
      "click .clear": "onClickClear"
    },
    behaviors: {
      OverflowFooterButtonBehavior: {
        behaviorClass: OverflowFooterButtonBehavior
      }
    },
    templateHelpers: function() {
      return {
        clear: lang.clear,
        search: lang.search
      };
    },
    constructor: function QueryFormFooterView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this, "query:form:validate", this._validate);
    },
    onClickSearch: function() {
      this.options.parent.triggerMethod("query:form:search");
    },
    _validate: function(isValid) {
      this.ui.searchbtn.prop("disabled", !isValid);
    },
    onClickClear: function() {
      this.options.parent.triggerMethod("query:form:clear");
    },
    disableButtons: function() {
      this.ui.searchbtn.prop("disabled", true);
    }
  });
  return QueryFormFooterView;
});