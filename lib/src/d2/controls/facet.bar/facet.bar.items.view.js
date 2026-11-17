/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/controls/facet.bar/impl/facet.bar.item.view", "css!d2/controls/facet.bar/impl/facet.bar" ], function(_, $, Marionette, FacetBarItemView) {
  var FacetBarItemsView = Marionette.CollectionView.extend({
    childView: FacetBarItemView,
    tagName: "ol",
    className: "d2-facet-list",
    getChildView: function(child) {
      if (child.get("facetBarItemView")) {
        return child.get("facetBarItemView");
      } else {
        return Marionette.CompositeView.prototype.getChildView.apply(this, arguments);
      }
    },
    constructor: function FacetBarItemsView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "reset", this._checkOverflow);
      this.listenTo(this.collection, "change", this._checkOverflow);
      this.listenTo(this.collection, "add", this._checkOverflow);
      this.listenTo(this.collection, "remove", this._checkOverflow);
      this.listenTo(this, "dom:refresh", this._calcScrollSteps);
      this.listenTo(this, "dom:refresh", this._checkOverflow);
    },
    _calcScrollSteps: function() {
      var el = this.$el[0];
      var ow = el.offsetWidth;
      var sw = el.scrollWidth;
      this.scrollStepPx = ow / 3 * 2;
      if (sw > ow) {
        var width = $(".d2-facet-list-bar").width();
        this.maxScrollLeft = sw - ow + width / 2;
      } else {
        this.maxScrollLeft = 0;
      }
    },
    _checkOverflow: function() {
      if (this.$el.length) {
        var el = this.$el[0];
        var ow = el.offsetWidth;
        var sw = el.scrollWidth;
        this.trigger("overflow", ow < sw);
        this.trigger("scrolled", {
          currentScrollLeft: this.$el.scrollLeft(),
          maxScrollLeft: this.maxScrollLeft
        });
      }
    },
    scrollLeft: function() {
      var el = this.$el;
      var currentScrollLeft = el.scrollLeft();
      var newScrollLeft = currentScrollLeft;
      if (currentScrollLeft <= this.maxScrollLeft) {
        newScrollLeft = currentScrollLeft + this.scrollStepPx;
        if (newScrollLeft > this.maxScrollLeft) {
          newScrollLeft = this.maxScrollLeft;
        }
        el.animate({
          scrollLeft: newScrollLeft
        }, 500);
      }
      this.trigger("scrolled", {
        currentScrollLeft: newScrollLeft,
        maxScrollLeft: this.maxScrollLeft
      });
      return newScrollLeft;
    },
    scrollRight: function() {
      var el = this.$el;
      var currentScrollLeft = el.scrollLeft();
      var newScrollLeft = 0;
      if (currentScrollLeft > this.scrollStepPx) {
        newScrollLeft = currentScrollLeft - this.scrollStepPx;
      }
      el.animate({
        scrollLeft: newScrollLeft
      }, 500);
      this.trigger("scrolled", {
        currentScrollLeft: newScrollLeft,
        maxScrollLeft: this.maxScrollLeft
      });
      return el.scrollLeft();
    }
  });
  return FacetBarItemsView;
});