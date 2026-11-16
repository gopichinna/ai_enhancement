/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/jquery", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/stepper.wizard/impl/stepper.util", "css!d2/controls/stepper.wizard/impl/step.footer" ], function(_, Marionette, $, WizardTabableRegionBehavior, stepperUtil) {
  "use strict";
  var ButtonView = Marionette.ItemView.extend({
    tagName: function() {
      return this.model && this.model.get("type") === "binf-icon" ? "button" : "otc-button";
    },
    className: function() {
      return this.model && this.model.get("type") === "binf-icon" ? "binf-btn binf-icon" : "d2-otc-btn";
    },
    template: false,
    triggers: {
      click: "click"
    },
    events: {
      mouseup: "onMouseUp",
      mousedown: "onMouseDown",
      keyup: "onKeyUp"
    },
    constructor: function ButtonView(options) {
      this.originatingView = options.originatingView;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onMouseUp: function() {
      this.originatingView.trigger("childview:mouseup", this);
    },
    onMouseDown: function() {
      this.originatingView.trigger("childview:mousedown", this);
    },
    onKeyUp: function(event) {
      this.originatingView.trigger("childview:keyup", this, event);
    },
    onBeforeRender: function() {
      var button = this.$el, attributes = this.model.attributes;
      button.addClass(attributes.className);
      if (attributes.align === "begin") {
        button.addClass("cs-separate");
      }
    },
    onDomRefresh: function() {
      this.updateButton(this.model.attributes);
    },
    updateButton: function(attributes) {
      attributes || (attributes = {});
      var $button = this.$el, step = this._parent && this._parent.currentStep || {}, label = stepperUtil.evaluateProperty("label", attributes, step.view), innerHtml = stepperUtil.evaluateProperty("innerHtml", attributes, step.view), ariaLabel = stepperUtil.evaluateProperty("ariaLabel", attributes, step.view), toolTip = stepperUtil.evaluateProperty("toolTip", attributes, step.view), hidden = stepperUtil.evaluateProperty("hidden", attributes, step.view), disabled = stepperUtil.evaluateProperty("disabled", attributes, step.view), iconOnly = stepperUtil.evaluateProperty("iconOnly", attributes, step.view), icon = stepperUtil.evaluateProperty("icon", attributes, step.view), isPrimary = stepperUtil.evaluateProperty("isPrimary", attributes, step.view);
      if (innerHtml) {
        $button.html(innerHtml);
      } else {
        $button.text(label || "");
      }
      $button.attr("ariaLabel", ariaLabel || attributes["defaultTooltip"] || label);
      $button.attr("title", toolTip || attributes["defaultTooltip"] || label || "");
      if (hidden !== undefined) {
        if (hidden) {
          $button.addClass("binf-hidden");
        } else {
          $button.removeClass("binf-hidden");
        }
      }
      if (disabled !== undefined) {
        $button.prop("disabled", disabled);
      }
      if (isPrimary) {
        $button.prop("type", "primary");
      } else {
        $button.prop("type", "secondary");
      }
      if (iconOnly !== undefined) {
        $button.attr("iconOnly", "");
        $button.prop("type", "basic");
      }
      if (icon !== undefined) {
        $button.attr("icon", icon);
        $button.attr("iconAppearance", "");
      }
    }
  });
  var StepFooterView = Marionette.CollectionView.extend({
    className: "footer-button-container",
    childView: ButtonView,
    childViewOptions: function() {
      return {
        originatingView: this
      };
    },
    sortWithCollection: false,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior,
        initialActivationWeight: 0
      }
    },
    constructor: function StepFooterView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.propagateDOMRefreshToChildren = true;
    },
    onDomRefresh: function() {
      if (this.propagateDOMRefreshToChildren) {
        this.children.each(function(buttonView) {
          buttonView.triggerMethod("dom:refresh");
        });
      } else {
        this.propagateDOMRefreshToChildren = true;
      }
      this.resetTabIndex();
    },
    setStep: function(step) {
      this.currentStep = step;
      this.propagateDOMRefreshToChildren = false;
      this.collection.reset(this.currentStep.buttons);
    },
    refresh: function(buttonIds) {
      var buttons = [];
      if (_.isUndefined(buttonIds)) {
        buttons = this.collection.models;
      } else if (_.isArray(buttonIds)) {
        _.each(buttonIds, function(btnId) {
          var button = this.collection.get(btnId);
          if (button) {
            buttons.push(button);
          }
        }.bind(this));
      }
      _.each(buttons, function(btn) {
        this.children.findByModel(btn).onDomRefresh();
      }.bind(this));
      if (document.activeElement) {
        document.activeElement.classList.remove("dctm-binf-hidden");
      }
      this.resetTabIndex();
    },
    resetTabIndex: function() {
      var tabElements = this.$("*[tabindex]:visible");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
    }
  });
  return StepFooterView;
});