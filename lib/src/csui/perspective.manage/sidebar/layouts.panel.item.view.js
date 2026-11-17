/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "hbs!csui/perspective.manage/impl/list.item" ], function(_, Marionette, ListItemTemplate) {
  "use strict";
  const LayoutsPanelItemView = Marionette.View.extend({
    constructor: function LayoutsPanelItemView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    tagName: "div",
    template: ListItemTemplate,
    templateContext: function() {
      return {
        draggable: !!this.options.draggable,
        className: this.options.itemClassName,
        iconClass: this.model.get("icon"),
        active: this.model.get("type") === this.options?.perspectiveType
      };
    },
    events: {
      "click .csui-layout-item:not(.binf-active)": _.debounce(function() {
        this.trigger("change:layout", this);
      }, 200, true),
      "keydown .csui-layout-item": _.debounce(function(event) {
        switch (event.key) {
         case "Enter":
         case " ":
          this.trigger("change:layout", this);
          break;

         case "ArrowUp":
          if (this.$el.prev().length) {
            this.$el.prev()[0].querySelector("*[tabindex], .csui-accordion-header").focus();
          }
          break;

         case "ArrowDown":
          if (this.$el.next().length) {
            this.$el.next()[0].querySelector("*[tabindex], .csui-accordion-header").focus();
          }
          break;

         case "Tab":
          if (event.shiftKey && event.key === "Tab") {
            this.$el.parents(".csui-sidebar-slide-main")[0].querySelectorAll(".csui-sidebar-slide-close")[0].focus();
          }
          event.preventDefault();
          break;
        }
      }, 200, true)
    }
  });
  return LayoutsPanelItemView;
});