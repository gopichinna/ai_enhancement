/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/controls/app.header/panel/groups/groups.list/standalone/group.standalone.view", "smart/controls/app.header/panel/groups/groups.list/card/group.card.view", "smart/lib/binf/js/binf" ], function($, _, Marionette, StandaloneView, CardView) {
  "use strict";
  let GroupsListView = Marionette.CollectionView.extend({
    tagName: "ul",
    childView: function(item) {
      if (item.get("type") === "standalone") {
        return StandaloneView;
      } else {
        return CardView;
      }
    },
    className: "smart-left-menu-groups-wrapper",
    childViewOptions: function(item) {
      let opts = {
        ...this.options
      };
      opts.model = item;
      opts.parentView = this;
      return opts;
    },
    attributes: {
      role: "menu"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function GroupsListView(options = {}) {
      Marionette.CollectionView.apply(this, arguments);
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      var retVal = false;
      switch (keyCode) {
       case 13:
       case 32:
        event.preventDefault();
        event.stopPropagation();
        $(event.target).click();
        break;

       case 38:
        var previousCardItem = this.getPreviousActiveItem();
        previousCardItem.trigger("focus");
        break;

       case 40:
        var nextCardItem = this.getNextActiveItem();
        nextCardItem.trigger("focus");
        break;

       default:
        return true;
      }
      return retVal;
    },
    getNextActiveItem: function() {
      var cardItems = document.querySelectorAll(".smart-card-visible");
      this.activeCardIndex = this.activeCardIndex ?? 0;
      if (this.activeCardIndex < cardItems.length - 1) {
        this.activeCardIndex++;
      }
      return $(cardItems[this.activeCardIndex]);
    },
    getPreviousActiveItem: function() {
      var cardItems = document.querySelectorAll(".smart-card-visible");
      this.activeCardIndex = this.activeCardIndex ?? 0;
      if (this.activeCardIndex > 0) {
        this.activeCardIndex--;
      }
      return $(cardItems[this.activeCardIndex]);
    }
  });
  return GroupsListView;
});