/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/stepper.wizard/impl/stepper.util", "hbs!d2/controls/stepper.wizard/impl/step.header", "i18n!d2/controls/stepper.wizard/impl/nls/lang", "css!d2/controls/stepper.wizard/impl/step.header" ], function(_, $, Marionette, WizardTabableRegionBehavior, stepperUtil, headerTemplate, lang) {
  "use strict";
  var StepHeaderView = Marionette.ItemView.extend({
    template: headerTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior,
        initialActivationWeight: 0
      }
    },
    ui: {
      tileTitle: ".tile-title",
      mainTitle: ".binf-modal-title.main-title",
      subTitle: ".binf-modal-title.subtitle"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function StepHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        dialogCloseButtonTooltip: lang.labelClose,
        dialogCloseAria: lang.ariaClose
      };
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger("click");
      }
    },
    onDomRefresh: function() {
      this.refresh();
    },
    setStep: function(step) {
      this.currentStep = step || {};
    },
    refresh: function() {
      if (this.currentStep) {
        var title = stepperUtil.evaluateProperty("title", this.currentStep, this.currentStep.view), subTitle = stepperUtil.evaluateProperty("subTitle", this.currentStep, this.currentStep.view);
        this.ui.mainTitle.attr("title", title);
        if (!subTitle) {
          this.ui.tileTitle.addClass("main-title-only");
        } else {
          this.ui.tileTitle.removeClass("main-title-only");
        }
        this.ui.mainTitle.text(title || "");
        this.ui.subTitle.text(subTitle || "");
      }
    },
    getTitle: function() {
      return this.ui.mainTitle.text();
    }
  });
  return StepHeaderView;
});