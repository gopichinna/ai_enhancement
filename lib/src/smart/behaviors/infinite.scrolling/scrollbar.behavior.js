/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette" ], function($, _, Marionette) {
  "use strict";
  var ScrollBarBehavior = Marionette.Behavior.extend({
    constructor: function ScrollBarBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, "dom:refresh", this.onDomRefresh);
    },
    onDomRefresh: function() {
      this.hasScrollbar();
    },
    hasScrollbar: function() {
      var scrollableEle = document.querySelectorAll(".csui-normal-scrolling");
      var smartScrollbar = document.querySelectorAll(".smart-has-scrollbar");
      if (smartScrollbar.length > 0) {
        smartScrollbar.forEach(element => {
          if (!element.classList.contains("csui-normal-scrolling")) {
            element?.classList?.remove("smart-has-scrollbar");
            element?.classList?.add("smart-has-no-scrollbar");
          }
        });
      }
      if (scrollableEle.length > 0) {
        scrollableEle.forEach(element => {
          if (element.scrollHeight > element.clientHeight) {
            element?.classList?.add("smart-has-scrollbar");
            element?.classList?.remove("smart-has-no-scrollbar");
          } else {
            element?.classList?.remove("smart-has-scrollbar");
            element?.classList?.add("smart-has-no-scrollbar");
          }
        });
      }
    }
  });
  return ScrollBarBehavior;
});