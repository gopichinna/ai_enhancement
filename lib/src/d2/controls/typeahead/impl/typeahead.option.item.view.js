/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "hbs!d2/controls/typeahead/impl/typeahead.option.item" ], function(_, $, Backbone, Marionette, template) {
  "use strict";
  var TypeaheadOptionItemView = Marionette.ItemView.extend({
    constructor: function TypeaheadOptionItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.parentView = this.options.parentView;
    },
    tagName: "li",
    className: "typeahead-option",
    template: template,
    ui: {
      typeaheadOptionItem: ".typeahead-option-item"
    },
    events: {
      click: "onClick",
      keydown: "onKeyDown"
    },
    onRender: function() {
      this.updateViewElementAttribute();
      if (this.model.get("selected")) {
        this.$el.addClass("binf-hidden");
      } else {
        this.$el.removeClass("binf-hidden");
      }
    },
    onClick: function(event) {
      this.parentView.onClickChildItem(this.model);
      event.preventDefault();
      event.stopPropagation();
    },
    updateViewElementAttribute: function() {
      this.$el.attr({
        id: this.model.get("id"),
        role: "option",
        title: this.model.get("name"),
        tabindex: -1
      });
    },
    onKeyDown: function(event) {
      var childView, currentIndex = this.collection.indexOf(this.model);
      var self = this;
      switch (event.which) {
       case 13:
        self.$el.trigger("click");
        break;

       case 38:
        if (currentIndex > 0) {
          var previousIndex = currentIndex - 1;
          childView = self.parentView.children.findByModel(this.collection.at(previousIndex));
          self.parentView.$el.find(".typeahead-option").removeClass("focus");
          childView.$el.trigger("focus");
          childView.$el.addClass("focus");
        }
        break;

       case 40:
        if (currentIndex < this.collection.length - 1) {
          var nextIndex = currentIndex + 1;
          childView = self.parentView.children.findByModel(this.collection.at(nextIndex));
          self.parentView.$el.find(".typeahead-option").removeClass("focus");
          childView.$el.trigger("focus");
          childView.$el.addClass("focus");
        }
        break;

       default:
        break;
      }
    }
  });
  return TypeaheadOptionItemView;
});