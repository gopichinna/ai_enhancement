/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "module", "smart/controls/progresspanel/progresspanel.view.ext", "csui/controls/form/pub.sub" ], function(_, $, Marionette, module, SmartProgressPanelView, PubSub) {
  "use strict";
  var ProgressPanelView = SmartProgressPanelView.extend({
    constructor: function ProgressPanelView(options) {
      options || (options = {});
      SmartProgressPanelView.prototype.constructor.call(this, options);
      this.listenTo(this.options.jobModel, "sync", this._updateHeader);
      this.listenTo(this, "navigate:to:location", this.onNavigateToLocation);
      this.parentView?.options?.messageRegionView?.listenTo(this.parentView?.options?.messageRegionView, "processing:completed processing:error", _.bind(this._onAllProcessCompleted, this));
      this.parentView?.options?.messageRegionView?.listenTo(this.parentView?.options?.messageRegionView, "collection:not:updated", _.bind(this._onAllProcessCompleted, this));
    },
    events: {
      click: "onNavigateToLocation",
      keydown: "onKeyDownEvent"
    },
    doShow: function(relatedView, parentView) {
      SmartProgressPanelView.prototype.doShow.call(this, relatedView, parentView);
      this.$el.addClass("processing-update");
      this.parentView && this.parentView.$el.find(".csui-minimize").addClass("d2-minimize");
      this.listenTo(this.parentView, "processbar:minimize", this.onMinimizeProgressPanel);
      if (this.parentView && this.parentView.$el.closest(".smart-progresspanel-wrapper").is(":hidden")) {
        this.onMinimizeProgressPanel();
      }
    },
    onMinimizeProgressPanel: function() {
      PubSub.trigger("d2-process-minimized");
    },
    _updateHeader: function() {
      var info = this.computeProgress();
      this.state = info.state;
      this.showProgressBar(info.isLoadTimeAvailable);
      this.ui.header.find(".csui-title").text(info.headerTitle);
      !this.isProgressFinalizing() && this.isProgressCompleted() && this.updateProgressPanel(info.failed);
      this.updateProgressArea(this.ui.header, info);
      this.ui.headerWrapper = this.$el;
      this.options && this.options.actionType ? this.ui.headerWrapper.addClass("progressBar-active") : this.ui.headerWrapper.removeClass("progressBar-active");
      this.ui.header.removeClass("smart-singleitem");
      if (this.collection.length === 1 && info.state === "rejected") {
        this.ui.expandIcon.removeClass("binf-hidden");
      } else {
        this.$el.find(".csui-items-wrapper .csui-names-progress").removeClass("binf-hidden");
      }
      if (info.state === "resolved" || info.state === "aborted") {
        this.ui.header.find(".csui-progress").addClass("binf-hidden");
        this.$el.addClass("csui-global-success");
        this.ui.header.addClass("smart-singleitem");
      }
      if (this.parentView) {
        var overallProgress = this.computeOverAllProgress();
        this.parentView.trigger("processbar:update:overall", overallProgress.percentage);
        if (!this.$el.hasClass("processing-completed") && !this.$el.hasClass("processing-error")) {
          this.$el.addClass("processing-update");
        }
      }
      if (info.state === "processing" || info.state === "resolved" || info.state === "aborted") {
        this.$el.find(".csui-header .csui-stateaction-processing").addClass("binf-hidden");
        this.parentView && this.parentView.$el.find(".csui-minimize").addClass("binf-hidden");
        this.parentView && this.parentView.$el.find(".csui-close").addClass("binf-hidden");
      }
      if (!this.stateExpandCollapse) {
        var arrow = this.ui.header.find(".csui-expand").find(":not(.binf-hidden)");
        if (arrow.hasClass("csui-expand-up")) {
          this.doExpand(false);
        } else if (arrow.hasClass("csui-expand-down")) {
          this.doCollapse(false);
        }
      }
      var isempty = !this.collection || this.collection.length === 0;
      if (this.$el.hasClass("csui-empty")) {
        if (!isempty) {
          this.$el.removeClass("csui-empty");
        }
      } else {
        if (isempty) {
          this.$el.addClass("csui-empty");
        }
      }
      if (this.stateExpandCollapse === "expanded") {
        var panelWrapper = this.$el.closest(".smart-progresspanel-wrapper"), itemListWrapper = this.$el.find(".csui-items-wrapper");
        this.doAdjustInnerWrapperHeight(panelWrapper, itemListWrapper);
      }
      this.currentlyFocusedElement().trigger("focus");
    },
    computeProgress: function() {
      var failed = 0, state = this.options.jobModel.getState(), count = state === "resolved" || state === "aborted" ? 1 : 0, total = 1;
      var percentage = total > 0 ? Math.floor(count / total * 100) : 0;
      return {
        count: count,
        total: total,
        failed: failed,
        percentage: percentage,
        state: state,
        dynamic: true,
        isLoadTimeAvailable: false,
        headerTitle: this.getHeaderTitle()
      };
    },
    getHeaderTitle: function() {
      var state = this.options.jobModel.getState();
      if (state === "pending") {
        return this.options.PendingHeaderTitle;
      }
      if (state === "processing") {
        return this.options.ProcessingHeaderTitle;
      }
      if (state === "resolved") {
        return this.options.CompletedHeaderTitle;
      }
      if (state === "aborted") {
        return this.options.AbortedHeaderTitle;
      }
      return "";
    },
    templateHelpers: function() {
      var info = SmartProgressPanelView.prototype.templateHelpers.call(this);
      info.enableCancel = true;
      info.enableMinimiseButton = true;
      return info;
    },
    onNavigateToLocation: function() {
      this.doClose();
      this.options.jobModel.trigger("restore:wizard", this.options.actionType);
    },
    onKeyDownEvent: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onNavigateToLocation();
      }
    },
    _onAllProcessCompleted: function() {
      this.$el?.find(".csui-minimize")?.removeClass("binf-hidden");
      this.$el?.find(".showless")?.removeClass("binf-hidden");
      this.$el?.hasClass("smart-expanded") && this.$el?.find(".closeall").addClass("smart-hide-behind");
    },
    className: "d2-minimize-progresspanel csui-progresspanel"
  });
  return ProgressPanelView;
});