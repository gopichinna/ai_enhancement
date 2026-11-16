/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "module", "smart/controls/progresspanel/progresspanel.view.ext", "d2/controls/toolbar.taskview/toolbar.taskview.manager", "dctmw/utils/utils", "i18n!d2/utils/job.tracker/impl/nls/lang" ], function(_, $, Marionette, module, SmartProgressPanelView, BGTaskViewManager, utils, lang) {
  "use strict";
  var ProgressPanelView = SmartProgressPanelView.extend({
    constructor: function ProgressPanelView(options) {
      options || (options = {});
      SmartProgressPanelView.prototype.constructor.call(this, options);
      this.listenTo(this.options.jobModel, "sync", this._updateHeader);
      this.listenTo(this, "abort:progress", this.onAbortProgress);
      this.pendingDfd = $.Deferred();
    },
    doShow: function(relatedView, parentView) {
      SmartProgressPanelView.prototype.doShow.call(this, relatedView, parentView);
      this.parentView && this.parentView.$el.find(".csui-minimize").addClass("d2-minimize");
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
      if (!this.options.allowMultipleInstances) {
        this.ui.minimizeButton.parent(".csui-minimize").addClass("binf-hidden");
      } else {
        if (this.parentView) {
          var overallProgress = this.computeOverAllProgress();
          this.parentView.trigger("processbar:update:overall", overallProgress.percentage);
          if (!this.$el.hasClass("processing-completed") && !this.$el.hasClass("processing-error")) {
            this.$el.addClass("processing-update");
          }
        }
        if (info.state === "processing") {
          this.ui.minimizeButton.parent(".csui-minimize").removeClass("binf-hidden");
        }
      }
      if (info.state === "processing") {
        this.$el.find(".csui-header .csui-stateaction-processing").removeClass("binf-hidden");
      }
      if (info.state === "resolved" || info.state === "aborted") {
        this.ui.closeAction.parent(".csui-close").removeClass("binf-hidden");
        this.$el.find(".csui-header .csui-stateaction-processing").addClass("binf-hidden");
        this.parentView && this.parentView.$el.find(".csui-minimize").addClass("binf-hidden");
      } else {
        this.parentView && this.parentView.$el.find(".csui-minimize").removeClass("binf-hidden");
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
      var failed = 0, state = this.options.jobModel.getState(), count = this.options.jobModel.get("total_completed"), total = state === "pending" ? 100 : this.options.jobModel.get("total");
      var percentage = total > 0 ? Math.floor(count / total * 100) : 0;
      if (state === "resolved" || state === "aborted") {
        this.pendingDfd.resolve();
      }
      return {
        count: count,
        total: total,
        failed: failed,
        percentage: percentage,
        state: state,
        dynamic: true,
        isLoadTimeAvailable: true,
        headerTitle: this.getHeaderTitle()
      };
    },
    getHeaderTitle: function() {
      return this.options.jobModel.getHeaderTitle();
    },
    templateHelpers: function() {
      var info = SmartProgressPanelView.prototype.templateHelpers.call(this);
      info.enableCancel = true;
      info.enableMinimiseButton = true;
      return info;
    },
    onAbortProgress: function() {
      this.options.jobModel.trigger("abort");
    },
    minimize: function() {
      if (utils.isJqueryPromise(this.pendingDfd)) {
        var taskControl = BGTaskViewManager.addTask({
          promise: this.pendingDfd.promise(),
          tooltip: lang.defaultToolbarNotificationTooltipOnMinimize
        });
        if (!taskControl) {
          return false;
        } else {
          this.minimizedState = {
            control: taskControl
          };
          this.listenTo(taskControl.eventSurface, "click", this.onToolbarBGTaskViewManagerClick.bind(this));
        }
      }
      return true;
    },
    onToolbarBGTaskViewManagerClick: function() {
      this.parentView.trigger("processbar:maximize");
      this.stopListening(this.minimizedState.control.eventSurface, "click");
      this.minimizedState.control.removeTask();
      delete this.minimizedState;
    },
    doClose: function() {
      const panel = _.extend({
        csuiAfterHide: _.bind(function() {
          if (this.isProgressCompleted()) {
            this.destroy();
            this.parentView.trigger("csui:after:hide", {
              panel: this,
              prevEle: prevEle
            });
            if (this.isProgressFailed()) {
              this.trigger("escaped:focus");
            }
            this.parentView.trigger("processbar:finished");
          }
        }, this)
      }, this);
      var prevEle = this.el.previousElementSibling;
      this.options.messageHelper.fadeoutPanel(panel);
      if (this.closePanel) {
        this.closePanel = false;
        panel.csuiAfterHide();
      }
    },
    className: "d2-tracker-progresspanel csui-progresspanel"
  });
  return ProgressPanelView;
});