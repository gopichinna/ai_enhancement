/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
        if (event.key === "Enter" || event.key === " ") {
          this.trigger("change:layout");
          document.querySelector(".binf-widgets.perspective-editing .cs-perspective-with-breadcrumb-view .csui-sidebar .csui-layout-item.binf-active").attr("tabindex", 0);
        }
      }, 200, true)
    }
  });
  return LayoutsPanelItemView;
});