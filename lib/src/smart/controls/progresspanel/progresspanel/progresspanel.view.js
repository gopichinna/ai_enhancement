/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/smart.base", "module", "nuc/utils/types/number", "smart/utils/accessibility", "smart/controls/progresspanel/progresspanel/progressbar.view", "i18n!smart/controls/progresspanel/progresspanel/impl/nls/progresspanel.lang", "hbs!smart/controls/progresspanel/progresspanel/impl/progresspanel", "css!smart/controls/progresspanel/progresspanel/impl/progresspanel", "css!smart/controls/globalmessage/globalmessage_icons" ], function(_, $, Marionette, smartBase, module, number, Accessibility, ProgressBarView, lang, panelTemplate) {
  "use strict";
  var config = _.defaults(module.config().csui || {}, module.config().smart || {}, {
    panelRefreshThrottle: 400
  });
  var BarStateValues = [ "pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing" ];
  var getContainerName = function(model) {
    var container = model.uploadContainer || model.container;
    return container && container.get("name");
  };
  var isMultiContainer = function(models) {
    var firstFolder = getContainerName(models[0]), lastFolder = getContainerName(models.reduce(function(currentModel, nextmodel) {
      return getContainerName(currentModel) === getContainerName(nextmodel) ? currentModel : !nextmodel;
    }));
    return firstFolder !== lastFolder;
  };
  var ProgressPanelView = Marionette.CompositeView.extend({
    constructor: function ProgressPanelView(options) {
      options || (options = {});
      this.focusChildIndex = -1;
      this.currentFocusIndex = 0;
      this.loadingCount = 0;
      _.defaults(options, {
        oneFileSuccess: lang.UploadOneItemSuccessMessage,
        multiFileSuccess: lang.UploadManyItemsSuccessMessage,
        oneFilePending: lang.UploadingSingleItem,
        oneFileFinalizing: lang.FinalizingSingleItem,
        multiFilePending: lang.UploadingItems,
        multiFileOneFailure: lang.MultiUploadOneItemFailMessage,
        oneFileFailure: lang.UploadOneItemFailMessage,
        multiFileFailure: lang.UploadManyItemsFailMessage,
        someFileSuccess: lang.UploadSomeItemsSuccessMessage,
        someFilePending: lang.UploadingSomeItems,
        someFileFailure: lang.UploadSomeItemsFailMessage2,
        oneItemStopped: lang.UploadingOneItemStopped,
        allItemsStopped: lang.UploadingAllItemsStopped,
        someItemsStopped: lang.UploadSomeItemsStopped,
        locationLabelPending: lang.UploadingLocation,
        locationLabelCompleted: lang.UploadedLocation,
        gotoLocationLinkLabel: lang.GotoLocationLinkLabel,
        enableCancel: true,
        isLoadTimeAvailable: false,
        stoppingLabel: lang.State_stopping
      });
      if (options.enableCancel) {
        this.panelStateValues = [ "resolved", "rejected", "aborted", "processing" ];
      } else {
        this.panelStateValues = [ "resolved", "rejected", "aborted" ];
      }
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.listenTo(this.collection, "change", this._updateHeader);
      this.listenTo(this.collection, "sort", this.setLocationName);
      this.originatingView = options.originatingView;
      if (!!this.originatingView) {
        this.originatingView.trigger("global.alert.inprogress");
      }
      this.isMultiContainer = isMultiContainer(this.collection.models);
      this.setLocationName();
      $(window).on("smart:progresspanel:collapse", _.bind(this._collapseProgresspanel, this));
      $(window).on("smart:progresspanel:closeall", _.bind(this._closeAllProgresspanels, this));
    },
    _collapseProgresspanel: function() {
      if (this._isPanelExpanded()) {
        this.doCollapse(true);
      }
    },
    _closeAllProgresspanels: function() {
      this.doClose();
    },
    updateProgressArea: function(elem, info) {
      var errorElem = elem.find(".csui-progress-static-rejected");
      if (info.dynamic === undefined ? info.state === "processing" : info.dynamic) {
        var progressBar = elem.find(".binf-progress-bar");
        this.options.messageHelper.switchField(elem, ".csui-progress", "dynamic", [ "static", "dynamic" ]);
        var bytesOfSize = _.str.sformat(lang.BytesOfSize, number.formatFileSize(info.count), number.formatFileSize(info.total));
        elem.find(".csui-progress-text").text(bytesOfSize);
        progressBar.attr("aria-valuenow", info.percentage);
        progressBar.css("width", _.str.sformat("{0}%", info.percentage));
        elem.find(".csui-progress-dynamic .csui-percent").text(_.str.sformat("{0}%", info.percentage));
      } else {
        this.options.messageHelper.switchField(elem, ".csui-progress", "static", [ "static", "dynamic" ]);
        this.options.messageHelper.switchField(elem, ".csui-progress-static", info.state, BarStateValues);
      }
      errorElem.text(info.errorMessage);
      errorElem.attr("title", info.errorMessage);
      if (info.errorMessage) {
        elem.addClass("csui-error");
      }
      this.options.messageHelper.switchField(elem, ".csui-stateaction", info.state, BarStateValues);
      if (this.itemsProcessing && this.itemsProcessing > 0) {
        this.$el.find(".csui-header .csui-stateaction-processing").removeClass("binf-hidden");
        this.$el.find(".csui-header .csui-stateaction-pending").addClass("binf-hidden");
      } else {
        this.$el.find(".csui-header .csui-stateaction-processing").addClass("binf-hidden");
      }
    },
    onDestroy: function() {
      this.handleProgressComplete();
      this.focusChildIndex = -1;
      this.focusingOnList = false;
      this.currentFocusIndex = 0;
      this.trigger("tabable:not");
      $(window).off("smart:progresspanel:collapse", this._collapseProgresspanel);
      $(window).off("smart:progresspanel:closeall", this._closeAllProgresspanels);
    },
    handleProgressComplete: function(allFailures) {
      this.originatingView && this.originatingView.trigger("global.alert.completed");
      if (!this.isProgressFailed()) {
        this.$el.removeClass("processing-update");
        this.$el.addClass("processing-completed");
      }
      if (!allFailures) {
        this.ui.gotoLocationElem && this.ui.gotoLocationElem.removeClass("binf-hidden");
        this.children.invoke("showGotoLocationElem");
      }
      this.children.invoke("handleProgressComplete");
    },
    autoHideSuccessBanner: function() {
      var self = this, hasLinks = _.find(this.collection.models, function(model) {
        return !_.isUndefined(model.get("targetLocation"));
      });
      if (!this.options.enablePermanentHeaderMessages && !Accessibility.isAccessibleMode() && (this.options.hideGotoLocationSingleSet || this.options.hideGotoLocationMultiSet || !hasLinks) && (this.options.doAutoClose === undefined || typeof this.options.doAutoClose === "boolean" && this.options.doAutoClose)) {
        var timeout = this.options.autoCloseTimeout || 5e3;
        setTimeout(function() {
          self.doClose();
        }, timeout);
      }
    },
    isProgressFailed: function() {
      return $.inArray(this.state, [ "rejected" ]) !== -1;
    },
    isProgressCompleted: function() {
      var state = $.inArray(this.state, [ "resolved", "rejected", "aborted", "stopped", "stopping" ]) !== -1;
      if (state && this.originatingView && this.originatingView.container && this.originatingView.container.get("type") === 136) {
        this.originatingView.container.unset("fileOrder");
      }
      return state;
    },
    isProgressFinalizing: function() {
      return $.inArray(this.state, [ "stopping" ]) !== -1;
    },
    getLocalizedLocation: function(model) {
      var langForStatus = this.isProgressCompleted() ? this.options.locationLabelCompleted : this.options.locationLabelPending;
      return _.str.sformat(langForStatus, getContainerName(model));
    },
    setLocationName: function() {
      var bundleNumber, location, currentLocation, self = this;
      this.collection.forEach(function(model) {
        if (model.get("bundleNumber") === bundleNumber) {
          model.unset("location");
          model.unset("bundleDivider");
        } else {
          model.set({
            bundleDivider: true
          }, {
            silent: true
          });
          bundleNumber = model.get("bundleNumber");
          currentLocation = getContainerName(model);
          if (currentLocation === location) {
            model.unset("location");
          } else {
            self.isMultiContainer && model.set({
              location: self.getLocalizedLocation(model)
            }, {
              silent: true
            });
            location = currentLocation;
          }
        }
      });
      this.collection.reset(this.collection.models);
    },
    updateProgressPanel: function(failedCount) {
      var notificationIcon, allFailures;
      if (this.isProgressFailed()) {
        this.$el.removeClass("processing-update");
        this.$el.addClass("processing-error");
        notificationIcon = "csui-global-error";
        allFailures = failedCount === this.collection.length;
      } else {
        notificationIcon = "csui-global-success";
        if (!this.parentView?.$el.find(".smart-progresspanel-wrapper")?.hasClass("binf-hidden")) {
          this.autoHideSuccessBanner();
        }
      }
      this.ui.processingAction.addClass("binf-hidden");
      this.ui.closeAction.parent(".csui-close").removeClass("binf-hidden");
      this.ui.header.find(".csui-minimize").addClass("binf-hidden");
      this.ui.header.find(".csui-progress").addClass("binf-hidden");
      this._isRendered && this.collection.sort();
      this.handleProgressComplete(allFailures);
      this.showretryAll();
      if (this.options.actionType && this.options.actionType === "ADD_VERSION") {
        return;
      }
      this.$el.addClass(notificationIcon);
    },
    showretryAll: function() {
      var isEnableRetry = this.options.configOptions ? this.options.configOptions.enableRetry : config.enableRetry;
      if (isEnableRetry && this.showretryAllElem) {
        this.ui.retryAll.removeClass("binf-hidden");
      }
    },
    showProgressBar: function(show) {
      if (show) {
        this.ui.progressBar && this.ui.progressBar.removeClass("binf-hidden");
        this.ui.loadingDots && this.ui.loadingDots.addClass("binf-hidden");
      } else {
        this.ui.progressBar.addClass("binf-hidden");
        this.ui.loadingDots.removeClass("binf-hidden");
      }
    },
    _updateHeader: function() {
      var info = this.computeProgress(), options = this.options;
      this.state = info.state;
      this.showProgressBar(info.isLoadTimeAvailable);
      switch (info.state) {
       case "pending":
       case "processing":
        info.label = this._getFormatString(options.oneFilePending, options.multiFilePending, this.collection.length);
        break;

       case "resolved":
        if (options.actionType && options.actionType === "ADD_VERSION") {
          break;
        }
        info.label = this._getFormatString(options.oneFileSuccess, options.multiFileSuccess, this.collection.length);
        break;

       case "stopping":
        info.label = options.stoppingLabel;
        break;

       case "stopped":
        info.label = this._getFormatString(options.oneItemStopped, options.someItemsStopped, this.collection.length);
        break;

       case "aborted":
        info.label = this._getFormatString(options.oneItemStopped, options.allItemsStopped, this.collection.length);
        break;

       case "finalizing":
        info.label = this._getFormatString(options.oneFileFinalizing, options.multiFilePending, this.collection.length);
        break;

       default:
        var isMultiFileOneFailure = this.collection.length > 1 && info.failed === 1;
        info.label = isMultiFileOneFailure ? options.multiFileOneFailure : this._getFormatString(options.oneFileFailure, options.multiFileFailure, info.failed);
      }
      this.ui.header.find(".csui-title").text(info.label);
      !this.isProgressFinalizing() && this.isProgressCompleted() && this.updateProgressPanel(info.failed);
      this.updateProgressArea(this.ui.header, info);
      this.ui.headerWrapper = this.$el;
      this.options && this.options.actionType ? this.ui.headerWrapper.addClass("progressBar-active") : this.ui.headerWrapper.removeClass("progressBar-active");
      if (info.state === "resolved" && !this.templateHelpers()?.targetLocationUrl) {
        this.ui.expandIcon.addClass("binf-hidden");
      } else {
        this.ui.expandIcon.removeClass("binf-hidden");
      }
      if (this.collection.length === 1 && info.state === "rejected") {
        this.ui.header.removeClass("smart-singleitem");
        this.ui.expandIcon.removeClass("binf-hidden");
      } else {
        this.$el.find(".csui-items-wrapper .csui-names-progress").removeClass("binf-hidden");
      }
      if (!this.options.allowMultipleInstances) {
        this.ui.minimizeButton.parent(".csui-minimize").addClass("binf-hidden");
      } else {
        if (this.parentView) {
          const overallProgress = this.computeOverAllProgress();
          this.parentView.trigger("processbar:update:overall", overallProgress.percentage);
          if (!this.$el.hasClass("processing-completed") && !this.$el.hasClass("processing-error")) {
            this.$el.addClass("processing-update");
          }
        }
        if (info.state === "processing") {
          this.ui.minimizeButton.parent(".csui-minimize").removeClass("binf-hidden");
        }
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
        let panelWrapper = this.$el.closest(".smart-progresspanel-wrapper"), itemListWrapper = this.$el.find(".csui-items-wrapper");
        this.doAdjustInnerWrapperHeight(panelWrapper, itemListWrapper);
      }
    },
    setFocusOnFirstEle: function() {
      var focusableEles = this.$el.find("*[tabindex]:visible").not(".binf-hidden");
      if (focusableEles.length) {
        if (this._getStackedPanelsLength() >= 1) {
          const lastPP = this._getPanelByIndex(this._getStackedPanelsLength() - 1);
          if (lastPP?.cid !== this.cid) {
            lastPP?._getAllFocusableElements()?.[0]?.setAttribute("tabindex", -1);
          }
        }
        focusableEles[0].setAttribute("tabindex", 0);
        focusableEles[0]?.focus();
      }
    },
    _getFormatString: function(str1, str2, count) {
      var formattedString, fileName;
      if (count === 1) {
        fileName = this.collection.models[0].get("newName") || this.collection.models[0].get("name");
        formattedString = _.str.sformat(str1, fileName);
      } else {
        formattedString = _.str.sformat(str2, count);
      }
      return formattedString;
    },
    computeProgress: function(collection) {
      collection = collection || this.collection;
      var allDone = true, processing = false, allAborted = true, stopped = false, finalizing = false, failed = 0, aborted = 0, count = 0, total = 0;
      this.itemsPending = 0;
      this.itemsProcessing = 0;
      var self = this;
      collection.forEach(function(item) {
        count += Number(item.get("count"));
        total += Number(item.get("total"));
        if (self._isRendered && item.get("errorMessage") && item.get("state") === "pending") {
          item.set("state", "rejected", {
            silent: true
          });
        }
        if (item.get("state") === "stopped") {
          stopped = true;
        }
        if (item.get("state") === "aborted") {
          ++aborted;
        }
        if (item.get("state") === "processing") {
          self.loadingCount += Number(item.get("count"));
          self.itemsProcessing++;
        }
        if (item.get("state") === "pending" || item.get("state") === "processing" || item.get("state") === "finalizing" || item.get("state") === "stopping") {
          allDone = false;
        }
        if (item.get("state") !== "pending") {
          processing = true;
        }
        if (item.get("state") === "pending") {
          if (self.itemsProcessing === 0) {
            self.itemsProcessing = 1;
          }
          self.itemsPending++;
        }
        if (item.get("state") === "rejected") {
          ++failed;
          item.set({
            sequence: 2
          }, {
            silent: true
          });
          self.showretryAllElem = !!item.get("serverFailure");
        }
        if (item.get("state") === "resolved" || item.get("state") === "rejected") {
          allAborted = false;
        }
      });
      var percentage = total > 0 ? Math.floor(count / total * 100) : 0;
      if (percentage === 100 && !allDone) {
        percentage = 99;
        finalizing = true;
      }
      if (allDone || finalizing) {
        this.itemsProcessing = 0;
      }
      var state = allDone ? failed ? "rejected" : stopped || aborted ? allAborted ? "aborted" : "stopped" : "resolved" : stopped ? "stopping" : finalizing ? "finalizing" : processing ? "processing" : "pending", dynamic = state !== "pending";
      this.parentView?.progressView?.trigger("get:progress", percentage, state);
      return {
        count: count,
        total: total,
        failed: failed,
        percentage: percentage,
        state: state,
        dynamic: dynamic,
        isLoadTimeAvailable: this.loadingCount > 0
      };
    },
    computeOverAllProgress: function() {
      let count = 0, total = 0, percentage = 0, inProgressPanels = 0;
      if (this.options?.stackProgressPanels?.length > 1) {
        this.options.stackProgressPanels.forEach(pp => {
          if (!pp.isProgressCompleted()) {
            const info = this.computeProgress(pp.collection);
            count += info.count || 0;
            total += info.total || 0;
            percentage += info.percentage || 0;
            inProgressPanels++;
          }
        });
        percentage = inProgressPanels > 0 ? Math.floor(percentage / inProgressPanels) : 0;
      } else {
        return this.computeProgress();
      }
      return {
        count: count,
        total: total,
        percentage: percentage
      };
    },
    className: "csui-progresspanel",
    childView: ProgressBarView,
    childViewContainer: ".csui-items",
    childEvents: {
      "click:gotolocation": "navigateToLocation",
      "abort:model:progress": "onClickModelCancel"
    },
    childViewOptions: function() {
      return _.extend(this.options, {
        enableCancel: this.options.enableCancel,
        messageHelper: this.options.messageHelper,
        reorderOnSort: true,
        parentView: this
      });
    },
    template: panelTemplate,
    templateHelpers: function() {
      var targetLocation, targetLocationUrl, info = this.computeProgress(), singleItem = this.collection.length === 1;
      if (!this.options.hideGotoLocationSingleSet && !this.isMultiContainer) {
        targetLocation = this.collection.models[0].get("targetLocation");
        targetLocationUrl = targetLocation && targetLocation.url;
      }
      BarStateValues.forEach(function(value) {
        info["state_" + value] = lang["State_" + value];
      });
      this.panelStateValues.forEach(function(value) {
        info["stateaction_" + value] = lang["StateAction_" + value];
        info["stateaction_all_" + value] = lang["StateAction_all_" + value];
      });
      info.cancel = lang.Cancel;
      info.enableCancel = this.options.enableCancel;
      info.expand = lang.Expand;
      info.collapse = lang.Collapse;
      info.close = lang.Close;
      info.closeAria = lang.CloseAria;
      info.detailsListAria = lang.DetailsListAria;
      info.processing = info.state === "processing" ? true : false;
      info.progressTitleId = _.uniqueId("progressTitle");
      this.progressTitleId = info.progressTitleId;
      info.singleItem = singleItem;
      info.enableMinimiseButton = this.options.enableMinimiseButton;
      info.minimize = lang.minimize;
      info.minimizeAria = lang.minimizeAria;
      info.gotoLocation = this.options.gotoLocationLinkLabel;
      info.retryAll = lang.RetryAll;
      info.enableRetry = this.options.configOptions ? this.options.configOptions.enableRetry : config.enableRetry;
      return _.extend(info, {
        targetLocationUrl: targetLocationUrl
      });
    },
    onRender: function() {
      this.setFocusOnFirstEle();
      this.$el.attr("role", "dialog");
      this.$el.attr("aria-labelledby", this.progressTitleId);
      this.currentlyFocusedElement();
      this._updateHeader();
      this.collection.comparator = function(currentModel, nextModel) {
        if (currentModel.get("bundleNumber") === nextModel.get("bundleNumber")) {
          return nextModel.get("sequence") - currentModel.get("sequence");
        }
      };
    },
    ui: {
      header: ".csui-header",
      progressBar: ".csui-header .binf-progress",
      loadingDots: ".csui-header .loading-dots",
      pendingAction: ".csui-header .csui-stateaction-pending",
      processingAction: ".csui-header .csui-stateaction-processing",
      closeAction: ".csui-header .csui-close button",
      collapseAction: ".csui-header .csui-expand-up",
      expandAction: ".csui-header .csui-expand-down",
      minimizeButton: ".csui-minimize .icon-progresspanel-minimize",
      expandIcon: ".csui-header .csui-expand",
      gotoLocationElem: ".csui-gotolocation-url",
      retryAll: ".csui-show-retryAll",
      childContainer: ".csui-items"
    },
    events: {
      "click @ui.pendingAction": "doCancel",
      "click @ui.processingAction": "doCancel",
      "click @ui.closeAction": "doClose",
      "keydown @ui.closeAction": "handleKeydownOnClose",
      "click @ui.collapseAction": "doCollapse",
      "click @ui.expandAction": "doExpand",
      "keydown @ui.expandAction": "handleKeydownOnExpand",
      "keydown @ui.collapseAction": "handleKeydownOnCollapse",
      "click @ui.minimizeButton": "_doProcessbarMinimize",
      "keydown @ui.minimizeButton": "onKeyInViewMinimize",
      "click @ui.gotoLocationElem": "handleGotoLocationClick",
      "keydown @ui.gotoLocationElem": "handleGotoLocationClick",
      "click @ui.retryAll": "processRetryAll",
      "keydown @ui.retryAll": "processRetryAll"
    },
    doCancel: function() {
      this.trigger("abort:progress");
      this.ui.processingAction.addClass("binf-hidden");
    },
    positionChange: function(newWidth) {
      if (newWidth !== undefined) {
        var parentWidth = this.$el.parent().width();
        var translateX = (parentWidth - newWidth) / 2;
        translateX > 0 || (translateX = 0);
        translateX = !!smartBase.isRTL() ? -translateX : translateX;
        translateX = "translateX(" + translateX + "px)";
        this.$el.css({
          transform: translateX
        });
      }
    },
    doCollapse: function(animated) {
      this.$el.removeClass("csui-expanded");
      animated = animated === false ? false : true;
      var items = this.$el.find(".csui-items");
      items.find(".focused-row").removeClass("focused-row");
      this.options.messageHelper.switchField(this.$el.find(".csui-header"), ".csui-expand", "down", [ "up", "down" ]);
      let itemListWrapper = this.$el.find(".csui-items-wrapper");
      $(itemListWrapper).slideUp();
      this.$el.removeClass("csui-expanded");
      this.$el.addClass("csui-collapsed");
      this.$el.closest(".progresspanel-container").addClass("csui-normal-scrolling-hide");
      this.stateExpandCollapse = "collapsed";
      this.$el.find(".csui-expand-down").trigger("focus");
      this.focusChildIndex = -1;
      this.focusingOnList = false;
      setTimeout(_.bind(function() {
        this.$el.removeClass("csui-expanded-panel");
        this.$el.parent().removeClass("csui-normal-scrolling-hide");
      }, this), 400);
    },
    doAdjustInnerWrapperHeight: function(panelWrapper, itemListWrapper) {
      let allProgressPanelHeaders = panelWrapper.find(".csui-header");
      let combinedHeaderHeight = 0;
      for (const panelHeader of allProgressPanelHeaders) {
        combinedHeaderHeight += panelHeader.offsetHeight + 6;
      }
      let totalProgressHeight = this.$el.closest(".binf-widgets").height();
      let clientCsuiItemsHeight = totalProgressHeight - (combinedHeaderHeight + 3) - 28 - 60;
      clientCsuiItemsHeight = clientCsuiItemsHeight < 120 ? 120 : clientCsuiItemsHeight;
      itemListWrapper.css({
        "max-height": clientCsuiItemsHeight + "px"
      });
    },
    doExpand: function(animated) {
      const isExpandedView = this._isExpandedView();
      $(window).trigger("smart:progresspanel:collapse");
      var panelWrapper = this.$el.closest(".smart-progresspanel-wrapper"), moreThanOnePanel = panelWrapper?.find(".csui-progresspanel")?.length > 1;
      if (!panelWrapper?.hasClass("smart-expanded") && moreThanOnePanel) {
        var showlessbutton = panelWrapper.find(".showless"), showMoreBtn = panelWrapper.find(".showmore"), closeAllButton = panelWrapper.find(".closeall");
        panelWrapper.addClass("smart-expanded");
        showMoreBtn.addClass("smart-hide-behind");
        const isAnyPending = this.options?.stackProgressPanels?.some(pp => !pp.isProgressCompleted()) || false;
        if (!isAnyPending && closeAllButton.hasClass("smart-hide-behind")) {
          closeAllButton.removeClass("smart-hide-behind");
        } else {
          showlessbutton.removeClass("smart-hide-behind");
          showlessbutton.removeClass("binf-hidden");
        }
      }
      var items = this.$el.find(".csui-items"), event = animated, self = this;
      animated = animated === false ? false : true;
      if (this.$el.width()) {
        this.collapsedWidth = this.$el.width();
      }
      this.options.messageHelper.switchField(this.$el.find(".csui-header"), ".csui-expand", "up", [ "up", "down" ]);
      let itemListWrapper = this.$el.find(".csui-items-wrapper");
      $(itemListWrapper).slideDown();
      this.$el.removeClass("csui-collapsed");
      this.$el.addClass("csui-expanding");
      this.$el.addClass("csui-expanded");
      itemListWrapper.addClass("csui-normal-scrolling-hide");
      setTimeout(function() {
        itemListWrapper.removeClass("csui-normal-scrolling-hide");
      }, 600);
      this.doAdjustInnerWrapperHeight(panelWrapper, itemListWrapper);
      if (this.$el.width()) {
        this.expandedWidth = this.$el.width();
      }
      this.stateExpandCollapse = "expanded";
      this.$el.one(this.options.messageHelper.transitionEnd(), function() {
        self.$el.removeClass("csui-expanding");
        self.$el.addClass("csui-expanded-panel");
      });
      if (event.type === "keydown" && (event.keyCode === 32 || event.keyCode === 13) && !isExpandedView && this.cid === this._getPanelByIndex(this._getStackedPanelsLength() - 1)?.cid) {
        const allFocusableElements = this._getAllFocusableElements();
        allFocusableElements?.length && allFocusableElements[0].focus();
      } else {
        this.ui.collapseAction.trigger("focus");
      }
    },
    handleKeydownOnExpand: function(event) {
      if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        event.preventDefault();
        this.doExpand(event);
      }
    },
    handleKeydownOnCollapse: function(event) {
      if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        event.preventDefault();
        this.doCollapse(event);
      }
    },
    onKeyInParentView: function(event) {
      var focusChanged = false;
      switch (event.keyCode) {
       case 9:
        var allFocusableElements = this._getAllFocusableElements(), activeElement = this.currentlyFocusedElem.length > 0 ? this.currentlyFocusedElem : document.activeElement;
        if (activeElement === allFocusableElements[0][0]) {
          this.currentFocusIndex = 0;
        }
        if (this.ui.childContainer.has(event.target).length) {
          if (event.shiftKey) {
            this.currentFocusIndex = allFocusableElements.length - 1;
            this.focusingOnList = false;
            focusChanged = true;
          }
        } else {
          var nextFocus = this.currentFocusIndex;
          if (event.shiftKey) {
            nextFocus--;
          } else {
            nextFocus++;
          }
          if (nextFocus >= 0 && nextFocus < allFocusableElements.length) {
            this.currentFocusIndex = nextFocus;
            focusChanged = true;
          } else if (nextFocus === allFocusableElements.length && this.focusChildIndex >= 0) {
            focusChanged = true;
            this.focusingOnList = true;
          }
        }
        break;
      }
      if (focusChanged) {
        this.trigger("changed:focus", this);
        this.currentlyFocusedElement();
        $(this.currentlyFocusedElem)[0].focus();
        this.$el.find(".focused-row") && this.$el.find(".focused-row").removeClass("focused-row");
        return false;
      }
    },
    onChildViewKeydown: function(childview, event) {
      var nextFocusIndex = this.focusChildIndex;
      switch (event.keyCode) {
       case 40:
        nextFocusIndex < this.children.length - 1 && ++nextFocusIndex;
        break;

       case 38:
        nextFocusIndex > 0 && --nextFocusIndex;
        break;
      }
      if (nextFocusIndex < 0 || nextFocusIndex >= this.children.length) {
        return;
      }
      if (this.focusChildIndex >= 0) {
        this.children.findByIndex(this.focusChildIndex).removeFocus();
      }
      this.focusChildIndex = nextFocusIndex;
      this.children.findByIndex(this.focusChildIndex).setFocus();
      this.trigger("changed:focus", this);
      return false;
    },
    _getStackedPanelsLength: function() {
      if (!this.options?.stackProgressPanels?.length) {
        return 0;
      }
      return this.options?.stackProgressPanels?.length;
    },
    _getPanelByIndex: function(index) {
      if (!this.options?.stackProgressPanels?.length) {
        return;
      }
      return this.options?.stackProgressPanels[index];
    },
    _getPanelIndex: function(panel = this) {
      if (!this.options?.stackProgressPanels) {
        return -1;
      }
      return this.options?.stackProgressPanels?.findIndex(item => item.cid === panel.cid);
    },
    _getSmartBtns: function() {
      const smartWrapper = this._getSmartWrapperEl();
      if (!smartWrapper) {
        return;
      }
    },
    _getMinimizeBtn: function() {
      const smartWrapper = this._getSmartWrapperEl();
      if (!smartWrapper) {
        return;
      }
      return smartWrapper.find(".miniprogressbar-btn-wrapper .csui-minimize button:visible");
    },
    _getSmartWrapperEl: function() {
      if (!this.parentView) {
        return;
      }
      return this.parentView?.$el.find(".smart-progresspanel-wrapper");
    },
    _isExpandedView: function() {
      return this._getSmartWrapperEl()?.hasClass("smart-expanded") || this._getStackedPanelsLength() === 1;
    },
    _isPanelExpanded: function() {
      return this.$el.hasClass("csui-expanded");
    },
    _doProcessbarMinimize: function() {
      this.$el.addClass("binf-hidden");
      this.parentView.trigger("processbar:minimize");
    },
    doShow: function(relatedView, parentView) {
      parentView?.trigger("make:stack:panels", {
        panel: this
      });
      this.options.messageHelper.showPanel(this, relatedView, parentView);
      this.parentView = parentView;
      this.$el.trigger("globalmessage.shown", this);
      if (this?.state === "rejected") {
        this?.parentView?.trigger("collection:not:updated");
      }
      this.trigger("dom:refresh");
      this.setFocusOnFirstEle();
    },
    currentlyFocusedElement: function() {
      if (this.isDestroyed) {
        return $();
      }
      if (this.focusingOnList && this.focusChildIndex >= 0) {
        this.currentlyFocusedElem = this.children.findByIndex(this.focusChildIndex).setFocus();
      } else {
        var allFocusableElements = this._getAllFocusableElements();
        this.currentlyFocusedElem = $(allFocusableElements[this.currentFocusIndex]);
      }
      return this.currentlyFocusedElem;
    },
    _getAllFocusableElements: function() {
      if (this.isRendered) {
        const allFocusableElements = this.ui.header.find("*[tabindex]:visible").toArray();
        return allFocusableElements;
      }
      return [];
    },
    _getChildFocusableElements: function() {
      let childFocusableElements = [];
      for (let i = 0; i < this.children?.length; i++) {
        const child = this.children.findByIndex(i);
        if (child) {
          let childEls = child.$el.find("button").not(".binf-hidden");
          if (childEls?.length) {
            childEls = childEls.toArray().filter(el => !$(el).parent().hasClass("binf-hidden"));
            childFocusableElements = [ ...childFocusableElements, ...childEls ];
          }
        }
      }
      return childFocusableElements;
    },
    doClose: function() {
      const panel = _.extend({
        csuiAfterHide: _.bind(function() {
          this.destroy();
          this.parentView.trigger("csui:after:hide", {
            panel: this,
            prevEle: prevEle
          });
          if (this.isProgressFailed()) {
            this.trigger("escaped:focus");
          }
          this.parentView.trigger("processbar:finished");
        }, this)
      }, this);
      var prevEle = this.el.previousElementSibling;
      this.options.messageHelper.fadeoutPanel(panel);
      if (this.closePanel) {
        this.closePanel = false;
        panel.csuiAfterHide();
      }
    },
    handleKeydownOnClose: function(event) {
      if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        this.doClose(event);
      }
    },
    handleGotoLocationClick: function(event) {
      if (event.type === "keydown" && (event.keyCode === 32 || event.keyCode === 13) || event.type === "click") {
        event.preventDefault();
        event.stopPropagation();
        this.navigateToLocation();
      }
    },
    navigateToLocation: function(childView) {
      this.trigger("navigate:to:location", childView);
      this.doCollapse();
      if (!childView) {
        this.doClose();
      }
    },
    onClickModelCancel: function(childView) {
      this.trigger("abort:model:progress", childView);
    },
    processRetryAll: function(event) {
      if (event.type === "keydown" && (event.keyCode === 32 || event.keyCode === 13) || event.type === "click") {
        this.trigger("retry:all");
      }
    }
  });
  return ProgressPanelView;
});