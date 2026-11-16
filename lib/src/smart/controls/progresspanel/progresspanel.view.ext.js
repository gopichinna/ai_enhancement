/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "smart/controls/progresspanel/progresspanel/progresspanel.view", "smart/controls/progresspanel/progressbar.view.ext", "nuc/utils/types/number", "i18n!smart/controls/progresspanel/progresspanel/impl/nls/progresspanel.lang", "hbs!smart/controls/progresspanel/progresspanel.ext" ], function(module, _, ProgressPanelViewImpl, ProgressBarView, number, lang, panelTemplate) {
  var config = _.defaults(module.config().csui || {}, module.config().smart || {}, {
    enhancePanel: false
  });
  var BarStateValues = [ "pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing" ];
  var ProgressPanelView = ProgressPanelViewImpl.extend({
    constructor: function ProgressPanelView(options) {
      ProgressPanelViewImpl.prototype.constructor.apply(this, arguments);
    },
    template: panelTemplate,
    childView: ProgressBarView,
    childViewOptions: function() {
      return _.extend(this.options, {
        enableCancel: this.options.enableCancel,
        messageHelper: this.options.messageHelper,
        reorderOnSort: true,
        parentView: this
      });
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
      var isCustomisedExpression = !!(this.itemsPending && this.itemsPending > 0) || !!(this.itemsProcessing && this.itemsProcessing > 0);
      if (isCustomisedExpression) {
        this.$el.find(".csui-header .csui-stateaction-processing").removeClass("binf-hidden");
        this.$el.find(".csui-header .csui-stateaction-pending").addClass("binf-hidden");
      } else {
        this.$el.find(".csui-header .csui-stateaction-processing").addClass("binf-hidden");
      }
    },
    templateHelpers: function() {
      var targetLocation, targetLocationUrl, info = this.computeProgress(), isEnhancePanel = this.options.configOptions ? this.options.configOptions.enhancePanel : config.enhancePanel, singleItem = this.collection.length === 1;
      if (!this.options.hideGotoLocationSingleSet && !this.isMultiContainer && !isEnhancePanel) {
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
      info.detailsListAria = lang.DetailsListAria;
      info.enableCancel = this.options.enableCancel;
      info.expand = lang.Expand;
      info.expandAria = lang.ExpandAria;
      info.collapse = lang.Collapse;
      info.collapseAria = lang.CollapseAria;
      info.close = lang.Close;
      info.closeAria = lang.CloseAria;
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
      info.enhancePanel = !isEnhancePanel;
      return _.extend(info, {
        targetLocationUrl: targetLocationUrl
      });
    },
    computeProgress: function() {
      return ProgressPanelViewImpl.prototype.computeProgress.apply(this, arguments);
    },
    doCancel: function() {
      var isPanelEnhanced = this.options.configOptions ? this.options.configOptions.enhancePanel : config.enhancePanel;
      this.collection.forEach(function(fileUpload) {
        var currentstate = fileUpload.get("state");
        var isCustomisedCondition = isPanelEnhanced ? Boolean(currentstate === "pending") : Boolean(currentstate === "pending" || currentstate === "processing");
        if (isCustomisedCondition) {
          fileUpload.set("abortState", true);
        }
      });
      this.trigger("abort:progress");
      this.ui.processingAction.addClass("binf-hidden");
    }
  });
  return ProgressPanelView;
});