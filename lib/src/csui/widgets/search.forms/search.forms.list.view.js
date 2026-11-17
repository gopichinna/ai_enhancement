/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/widgets/search.forms/search.forms.item.view", "css!csui/widgets/search.forms/impl/search.forms" ], function(_, Marionette, SearchFormsItemView) {
  "use strict";
  var SearchFormsListView = Marionette.CollectionView.extend({
    className: "csui-search-form-list",
    childView: SearchFormsItemView,
    attributes: function() {
      return {
        role: "list",
        "aria-labelledby": this.options.ariaLabelledBy
      };
    },
    childViewOptions: function() {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this
      };
    },
    constructor: function SearchFormsListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    }
  });
  return SearchFormsListView;
});