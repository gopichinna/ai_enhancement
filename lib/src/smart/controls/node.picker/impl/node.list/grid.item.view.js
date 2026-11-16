/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/node.picker/impl/node.list/list.item.view", "hbs!smart/controls/node.picker/impl/node.list/grid.item" ], function(_, $, Marionette, ListItemView, gridItemTemplate) {
  var gridListItemView = ListItemView.extend({
    template: gridItemTemplate,
    events: function() {
      var parentEvents = ListItemView.prototype.events.call(this);
      var extendedEvents = {
        "mouseover .smart-list-title": "onTitleHover",
        "mouseleave .smart-list-title": "onTitleHoverExit",
        "mousedown .smart-list-title": "onTitleMouseDown",
        "mouseup .smart-list-title": "onTitleMouseUp"
      };
      return _.extend({}, parentEvents, extendedEvents);
    },
    constructor: function gridListItemView(options = {}) {
      this.options = options;
      ListItemView.prototype.constructor.apply(this, arguments);
      if (this.model.newlyAddedNode) {
        this.el?.classList?.add("smart-new-item");
      } else {
        this.el?.classList?.remove("smart-new-item");
      }
    },
    onTitleHover: function() {
      this.el.classList.add("smart-hover-style");
    },
    onTitleHoverExit: function() {
      this.el.classList.remove("smart-hover-style");
    },
    onTitleMouseDown: function() {
      this.el.classList.add("smart-active-style");
    },
    onTitleMouseUp: function() {
      this.el.classList.remove("smart-active-style");
    }
  });
  return gridListItemView;
});