/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/progresspanel/progresspanel/progressbar.view", "module", "i18n!smart/controls/progresspanel/progresspanel/impl/nls/progresspanel.lang", "hbs!smart/controls/progresspanel/progressbar.ext" ], function(_, $, Marionette, ProgressBarViewImpl, module, lang, barTemplate) {
  "use strict";
  var config = _.defaults(module.config().csui || {}, module.config().smart || {}, {
    enhancePanel: false
  });
  var BarStateValues = [ "pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing" ];
  var ProgressBarView = ProgressBarViewImpl.extend({
    constructor: function ProgressBarView(options = {}) {
      this.ui = _.extend({}, this.ui, ProgressBarViewImpl.prototype.ui);
      options?.model?.get("iconView") && (this.iconView = options.model.get("iconView"));
      ProgressBarViewImpl.prototype.constructor.apply(this, arguments);
    },
    template: barTemplate,
    templateHelpers: function() {
      var info = this.computeProgress(), model = this.model, singleItem = this.collection.length === 1, name = this.getItemLabel(), cancelAria = _.str.sformat(lang.CancelAria, name), commandName = !!model.get("commandName") || model.get("commandName"), location = model.get("targetLocation"), enhancePanel = this.options.configOptions ? this.options.configOptions.enhancePanel : config.enhancePanel, targetLocation = enhancePanel ? location : !this.options.hideGotoLocationMultiSet && location ? location : undefined;
      if (this.model.get("state") !== "resolved") {
        targetLocation = undefined;
      }
      if (enhancePanel) {
        info.loadingCount = info.count ? info.count : undefined;
        info.isLoadTimeAvailable = info.loadingCount > 0;
      }
      info.name = name;
      info.styles = "";
      info.enableCancel = this.options.enableCancel;
      info.type_icon_class = "";
      if (this.iconView) {
        info.type_icon_class += " leading-app-custom-mime-icon ";
      } else {
        info.type_icon_class = this.model.get("typeIconClass") || this.options.typeIconClass || "";
      }
      BarStateValues.forEach(function(value) {
        info["state_" + value] = lang["State_" + value];
      });
      info.cancel = lang.Cancel;
      info.cancelAria = cancelAria;
      info.expand = lang.Expand;
      info.collapse = lang.Collapse;
      info.close = lang.Close;
      info.singleItem = singleItem;
      info.minimize = lang.minimize;
      info.minimizeAria = lang.minimizeAria;
      info.retry = lang.Retry;
      info.gotoLocation = this.options.parentView.options.gotoLocationLinkLabel;
      info.targetLocationUrl = targetLocation ? targetLocation.url : undefined;
      info.enableRetry = this?.options?.configOptions?.enableRetry ?? config.enableRetry ?? false;
      info.notEnhancedPanel = !enhancePanel && !!this.options.parentView.isMultiContainer;
      info.isEnhancedPanel = enhancePanel;
      info.errorIconAria = lang.ErrorIconAria;
      info.successIconAria = lang.SuccessIconAria;
      return info;
    },
    ui: {
      loadingDots: ".loading-dots",
      progressBar: ".binf-progress"
    },
    onRender: function() {
      ProgressBarViewImpl.prototype.onRender.apply(this, arguments);
      if (this.iconView) {
        let el = this.$el.find(".csui-type.mime-icon");
        let region = new Marionette.Region({
          el: el
        });
        region.show(this.iconView);
      }
    },
    hanldleClickGotoLocation: function(event) {
      return ProgressBarViewImpl.prototype.hanldleClickGotoLocation.apply(this, arguments);
    },
    _updateItem: function() {
      var info = this.computeProgress(), isEnhancePanel = this.options.configOptions ? this.options.configOptions.enhancePanel : config.enhancePanel, elem = this.$el;
      if (isEnhancePanel) {
        info.loadingCount = info.count ? info.count : undefined;
        info.isLoadTimeAvailable = info.loadingCount > 0;
      }
      this.showProgressBar(info.isLoadTimeAvailable);
      this.options.parentView.updateProgressArea(elem, info);
      if (isEnhancePanel && this.model.get("state") === "processing") {
        elem[0] && elem[0].getElementsByClassName("csui-stateaction-pending")[0].classList.add("binf-hidden");
        elem[0] && elem[0].getElementsByClassName("csui-stateaction-processing")[0].classList.add("binf-hidden");
      }
    },
    showProgressBar: function(show) {
      var elem = this.$el;
      if (show) {
        this.ui.progressBar[0] && this.ui.progressBar[0].classList && this.ui.progressBar[0].classList.remove("binf-hidden");
        this.ui.loadingDots[0] && this.ui.loadingDots[0].classList && this.ui.loadingDots[0].classList.add("binf-hidden");
      } else {
        this.ui.progressBar[0] && this.ui.progressBar[0].classList && this.ui.progressBar[0].classList.add("binf-hidden");
        this.ui.loadingDots[0] && this.ui.loadingDots[0].classList && this.ui.loadingDots[0].classList.remove("binf-hidden");
      }
    },
    computeProgress: function() {
      return ProgressBarViewImpl.prototype.computeProgress.apply(this, arguments);
    }
  });
  return ProgressBarView;
});