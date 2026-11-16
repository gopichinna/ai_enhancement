/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/controls/app.header/search/forms/forms.item.view", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function(module, _, $, Marionette, Backbone, FormItemView, lang) {
  let FormsCollView = Marionette.CollectionView.extend({
    tagName: "otc-menugroup",
    childView: FormItemView,
    className: "formContainer",
    childViewOptions: function() {
      return {
        leadingView: this.options.leadingView
      };
    },
    attributes: function() {
      let attr = {};
      attr.name = lang.recentSearchforms;
      return attr;
    },
    constructor: function SearchBoxCollView(options = {}) {
      Marionette.CollectionView.apply(this, arguments);
    }
  });
  return FormsCollView;
});