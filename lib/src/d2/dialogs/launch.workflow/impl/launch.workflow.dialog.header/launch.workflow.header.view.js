/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery", "nuc/lib/marionette", "d2/controls/stepper.wizard/impl/step.header.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/stepper.wizard/impl/stepper.util", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.dialog.header/step.header", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.dialog.header/flow.item", "i18n!d2/dialogs/launch.workflow/impl/nls/lang", "i18n!d2/controls/stepper.wizard/impl/nls/lang", "css!d2/controls/stepper.wizard/impl/step.header", "css!d2/dialogs/launch.workflow/impl/launch.workflow.dialog.header/step.header" ], function(_, Backbone, $, Marionette, StepHeaderView, WizardTabableRegionBehavior, stepperUtil, headerTemplate, flowItemTemplate, lang, StepLang) {
  "use strict";
  var FlowItemView = Marionette.ItemView.extend({
    template: flowItemTemplate,
    className: "d2-flow-item",
    triggers: {
      click: "on:click"
    },
    events: {
      keydown: "onkeyDown"
    },
    templateHelpers: function() {
      var label = lang[this.model.get("id") + "_Section_Title"], ariaLabelRequired = this.model.get("required") ? lang.ariaLabelRequired : lang.ariaLabelOptional, ariaLabelStep = _.str.sformat(lang.ariaLabelStep, ariaLabelRequired, label, lang["aria_label_" + this.model.get("state")]);
      return {
        label: label,
        progressStateClass: this.model.get("state"),
        isFirst: this.model.collection.first() === this.model,
        isLast: this.model.collection.last() === this.model,
        required: this.model.get("required"),
        ariaLabelStep: ariaLabelStep
      };
    },
    constructor: function FlowItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", this.render);
    },
    onRender: function() {
      if (this.model.get("disabled")) {
        this.$el.addClass("flow-disabled");
      } else {
        this.$el.removeClass("flow-disabled");
      }
    },
    onShow: function() {
      this.$el.prop("tabindex", "0");
    },
    onkeyDown: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        this.trigger("on:click");
        break;
      }
    }
  });
  var LaunchWorkflowDialogHeaderView = Marionette.CompositeView.extend({
    template: headerTemplate,
    childView: FlowItemView,
    childEvents: {
      "on:click": "onChildClicked"
    },
    childViewContainer: ".d2-wizard-flow",
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
    constructor: function LaunchWorkflowDialogHeaderView(options) {
      options.wizard = options.data.wizard;
      var headerDefs = _.reduce(options.steps, function(memo, obj) {
        memo.push({
          id: obj.id,
          state: "not-visited",
          required: obj.isRequired,
          disabled: false
        });
        return memo;
      }, []);
      options.collection = new Backbone.Collection(headerDefs);
      this.stepIds = _.pluck(options.steps, "id");
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        dialogCloseButtonTooltip: StepLang.labelClose,
        dialogCloseAria: StepLang.ariaClose
      };
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger("click");
      }
    },
    onChildClicked: function(view) {
      var targetId = view.model.get("id");
      if (this.currentStep.view.isValid() && this.currentStep.id !== targetId) {
        _.isFunction(this.currentStep.view.updateModelData) && this.currentStep.view.updateModelData();
        var animationDirectionFromEnd = this._calculateAnimationDirection(this.currentStep.id, targetId);
        this.options.wizard.gotoStep(targetId, animationDirectionFromEnd);
      }
    },
    _calculateAnimationDirection: function(currentStepId, targetStepId) {
      return this.stepIds.indexOf(currentStepId) < this.stepIds.indexOf(targetStepId);
    },
    onDomRefresh: function() {
      this.refresh();
    },
    setStep: function(step) {
      if (this.currentStep) {
        this.options.collection.get(this.currentStep.id).set("state", "complete");
      }
      this.currentStep = step || {};
      this.options.collection.get(this.currentStep.id).set("state", "active");
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
        if (!this.currentStep.view.isValid()) {
          this.setDisabled(true);
        } else {
          this.setDisabled(false);
        }
      }
    },
    setDisabled: function(value) {
      this.collection.forEach(function(stepModel) {
        stepModel.set("disabled", value);
      });
    },
    getTitle: function() {
      return this.ui.mainTitle.text();
    }
  });
  return LaunchWorkflowDialogHeaderView;
});