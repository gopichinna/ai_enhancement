/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/controls/typeahead/impl/typeahead.option.item.view", "d2/controls/typeahead/impl/typeahead.lazy.loading.view" ], function(_, $, Backbone, Marionette, TypeaheadOptionItemView, TypeaheadLazyLoadingView) {
  "use strict";
  var TypeaheadOptionsView = Marionette.CollectionView.extend({
    constructor: function TypeaheadOptionsView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.typeaheadView = this.options.typeaheadView;
    },
    className: "typeahead-options",
    emptyView: TypeaheadLazyLoadingView,
    childView: function() {},
    buildChildView: function(child, ChildViewClass, childViewOptions) {
      var options = _.extend({
        model: child
      }, childViewOptions);
      var view;
      if (this.collection.length === 0) {
        view = new TypeaheadLazyLoadingView(options);
      } else if (this.options.optionViewClass) {
        view = new this.options.optionViewClass(options);
      } else {
        view = new TypeaheadOptionItemView(options);
      }
      return view;
    },
    childViewOptions: function() {
      return _.extend({
        parentView: this
      }, this.options);
    },
    tagName: "ul",
    onRender: function() {
      this.$el.attr({
        role: "listbox"
      });
    },
    onClickChildItem: function(model) {
      this.typeaheadView.onOptionSelect(model);
    },
    getOptionsElements: function() {
      return this.$el.find("li");
    }
  });
  return TypeaheadOptionsView;
});