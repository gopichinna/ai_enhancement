/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/base", "csui/perspective.manage/impl/widget.item.view" ], function(base, WidgetItemView) {
  "use strict";
  const WidgetPanelItemView = WidgetItemView.extend({
    constructor: function WidgetPanelItemView(options) {
      options || (options = {});
      WidgetItemView.prototype.constructor.apply(this, arguments);
    },
    initialize: function(options) {
      this.listenTo(this, "expand:header", this.expandHeader);
    },
    expandHeader: function() {
      this.ui.accordionHeader.addClass("csui-accordion-expand");
      this.$el.addClass("csui-accordion-visible");
      base.onTransitionEnd(this.ui.accordionContent, function() {
        this.trigger("widgets:expanded");
      }, this);
    },
    toggle: function() {
      let isExpanded = this.ui.accordionHeader.hasClass("csui-accordion-expand");
      if (!isExpanded) {
        this.options.parentView.el.querySelectorAll(".csui-module-group").forEach(ele => ele.classList.remove("csui-accordion-visible"));
        this.options.parentView.el.querySelectorAll(".csui-accordion-header").forEach(ele => ele.classList.remove("csui-accordion-expand"));
      }
      this.el.querySelector(".csui-accordion-header").classList.toggle("csui-accordion-expand");
      this.el.classList.toggle("csui-accordion-visible");
      base.onTransitionEnd(this.ui.accordionContent, function() {
        this.trigger("widgets:expanded");
      }, this);
    }
  });
  return WidgetPanelItemView;
});