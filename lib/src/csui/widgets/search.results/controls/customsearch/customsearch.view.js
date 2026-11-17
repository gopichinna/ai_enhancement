/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/widgets/search.results/controls/customsearch/impl/customsearch", "csui/widgets/search.custom/impl/search.object.view" ], function($, Marionette, template, SearchObjectView) {
  var customSearchView = Marionette.ItemView.extend({
    className: "search-custom",
    template: template,
    ui: {
      customSearch: "#csui-search-custom"
    },
    constructor: function customSearchView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options.savedSearchQueryId) {
        var customSearchRegion = new Marionette.Region({
          el: this.ui.customSearch
        }), customSearchTitle = this.$el.find(".csui-search-custom-title");
        this.customSearchView = new SearchObjectView({
          context: this.options.context,
          savedSearchQueryId: this.options.savedSearchQueryId,
          customValues: this.options.customValues,
          titleElement: customSearchTitle
        });
        customSearchRegion.show(this.customSearchView);
      }
    }
  });
  return customSearchView;
});