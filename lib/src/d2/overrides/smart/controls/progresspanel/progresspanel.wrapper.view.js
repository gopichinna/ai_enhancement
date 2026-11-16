/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/progresspanel.wrapper.view", "csui/controls/form/pub.sub" ], function(ProgressPanelWrapperView, PubSub) {
  "use strict";
  var oldMakeStackPanels = ProgressPanelWrapperView.prototype._makeStackPanels;
  ProgressPanelWrapperView.prototype._onProcessPending = function() {
    this.$el?.find(".csui-minimize")?.removeClass("binf-hidden");
    this.$el?.hasClass("smart-expanded") && this.$el?.find(".showless")?.removeClass("binf-hidden");
    this.$el?.find(".d2-minimize-progresspanel").length > 0 ? this.$el?.find(".closeall")?.addClass("binf-hidden") : this.$el?.find(".closeall")?.addClass("smart-hide-behind");
  };
  ProgressPanelWrapperView.prototype._onAllProcessCompleted = function() {
    PubSub.trigger("d2-all-process-completed");
    this.$el?.find(".csui-minimize")?.addClass("binf-hidden");
    this.$el?.hasClass("smart-expanded") && this.$el?.find(".showless")?.removeClass("binf-hidden");
    if (this.$el?.find(".d2-minimize-progresspanel").length > 0) {
      this.$el?.find(".closeall")?.addClass("smart-hide-behind");
    } else {
      this.$el?.hasClass("smart-expanded") && this.$el?.find(".closeall").removeClass("smart-hide-behind");
    }
  };
  ProgressPanelWrapperView.prototype._makeStackPanels = function() {
    oldMakeStackPanels.apply(this, arguments);
    if (this.stackProgressPanels?.length > 1 && this.$el.hasClass("smart-expanded")) {
      this.ui.showMoreBtn.addClass("smart-hide-behind");
    }
  };
});