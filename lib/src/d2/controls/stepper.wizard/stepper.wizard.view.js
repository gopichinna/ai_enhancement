/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "i18n", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/utils/non-emptying.region/non-emptying.region", "nuc/utils/page.leaving.blocker", "nuc/utils/base", "d2/controls/stepper.wizard/impl/step.header.view", "d2/controls/stepper.wizard/impl/step.footer.view", "d2/controls/stepper.wizard/impl/stepper.util", "d2/controls/toolbar.taskview/toolbar.taskview.manager", "d2/dialogs/new.file/edit/header.message.view", "d2/utils/constants", "dctmw/utils/utils", "dctmw/utils/authenticators/session", "hbs!d2/controls/stepper.wizard/impl/stepper.wizard", "i18n!d2/controls/stepper.wizard/impl/nls/lang", "csui/controls/icons.v2", "css!d2/controls/stepper.wizard/impl/stepper.wizard", "csui/lib/binf/js/binf" ], function(_, $, i18n, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, TabablesBehavior, NonEmptyingRegion, pageLeavingBlocker, base, StepHeaderView, StepFooterView, stepperUtil, BGTaskViewManager, D2HeaderMessageView, constants, utils, Session, wizardTemplate, lang) {
  "use strict";
  function adjustToFlowDirection(value) {
    return (i18n.settings.rtl ? -1 : 1) * value;
  }
  function manageWizardSize(options) {
    if (options?.size && utils.isTabletDevice()) {
      options.size = constants.WizardSize.SMALL;
    }
  }
  var HorizontalSlidingRegion = NonEmptyingRegion.extend({
    attachHtml: function(view) {
      var width = this.$el.width(), $primaryEl, $secondaryEl, $swapInParent = view.$el.parent(".d2-wizard-step-view"), $swapOutParent = this.lastView && this.lastView.$el.parent(".d2-wizard-step-view"), wizard = this._parent && this._parent._parent;
      if ($swapInParent.length === 0) {
        $swapInParent = view.$el.wrap('<div class="d2-wizard-step-view"></div>').parent();
      }
      $swapInParent.removeClass("binf-hidden");
      if (this.animationDirectionFromEnd) {
        $swapInParent.css({
          left: adjustToFlowDirection(width * .8),
          "z-index": 1
        });
        $primaryEl = $swapInParent;
        $secondaryEl = $swapOutParent;
      } else {
        if (this.lastView) {
          $swapOutParent.css({
            "z-index": 1
          });
          $primaryEl = $swapOutParent;
        }
        $swapInParent.css({
          left: adjustToFlowDirection(width * -.1)
        });
        $secondaryEl = $swapInParent;
      }
      this.$el.prepend($swapInParent);
      this.animating = true;
      $primaryEl.animate({
        left: adjustToFlowDirection(this.animationDirectionFromEnd ? 0 : width * .8)
      }, {
        duration: this.lastView ? 300 : 0,
        progress: function(promise, progress) {
          $secondaryEl && $secondaryEl.css({
            left: adjustToFlowDirection(width * -.1 * (this.animationDirectionFromEnd ? progress : 1 - progress))
          });
        }.bind(this),
        complete: function() {
          if (this.lastView) {
            this.lastView.triggerMethod("step:inactive");
            $swapOutParent.addClass("binf-hidden");
            $swapOutParent.css({
              "z-index": 0
            });
            $swapOutParent.detach();
            delete this.lastView;
          }
          $swapInParent.css({
            "z-index": 0
          });
          view.triggerMethod("step:active");
          setTimeout(function() {
            this.animating = false;
            wizard && wizard.trigger("wizard:step:transitioned", wizard.currentStep);
            wizard && wizard._triggerEventOnChannel("wizard:step:transitioned");
            view.triggerMethod("wizard:step:transitioned");
          }.bind(this), 0);
        }.bind(this)
      });
    },
    empty: function() {
      var view = this.currentView;
      if (view) {
        this.lastView = view;
      }
      return NonEmptyingRegion.prototype.empty.apply(this, arguments);
    }
  });
  var WizardTabableBehavior = TabablesBehavior.extend({
    constructor: function WizardTabableBehavior(options, view) {
      TabablesBehavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.stopListening(view, "dom:refresh");
      this.listenTo(view, "dom:refresh", this._setFocusInActiveTabableRegion);
      this.listenTo(view, "wizard:minimized", this._onWizardMinimized);
    },
    _onWizardMinimized: function() {
      this._popTabableHandler();
      this.listenToOnce(this.view, "wizard:restored", this._reinstateSelf);
    },
    _reinstateSelf: function() {
      this.mustSortTabableRegions = false;
      this.listenTo(this.view, "destroy", this._popTabableHandler);
      this.listenTo(this.view, "dom:refresh", this.setFocusInActiveTabableRegion);
      this.listenTo(this.view, "changed:focus", this._setFocusToNextRegion);
      this.listenTo(this.view, "wizard:minimized", this._onWizardMinimized);
      this.view.$el.on("keydown.csui-tabables", function(event) {
        if (event.keyCode === 9 && this.getOption("containTabFocus")) {
          return this._maintainTabFocus(event);
        }
      }.bind(this));
      this._pushTabableHandler();
      _.each(this.tabableRegions, function(tabableRegion) {
        tabableRegion.setInitialTabIndex.call(tabableRegion);
        tabableRegion._registerEventHandlers.call(tabableRegion);
      });
      this._setFocusInActiveTabableRegion();
    }
  });
  var StepperWizardView = Marionette.LayoutView.extend({
    className: function() {
      var className = "d2-stepper-wizard cs-dialog binf-modal binf-fade";
      if (this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      if (this.options.viewMode === constants.WizardType.DIALOG) {
        className += " dialog-mode";
      } else if (this.options.size) {
        switch (this.options.size) {
         case constants.WizardSize.X_SMALL:
          className += " wizard-x-small-";
          break;

         case constants.WizardSize.SMALL:
          className += " wizard-small";
          break;

         case constants.WizardSize.MEDIUM:
          className += " wizard-medium";
          break;

         case constants.WizardSize.LARGE:
          className += " wizard-large";
          break;

         case constants.WizardSize.X_LARGE:
          className += " wizard-x-large";
          break;

         default:
          break;
        }
      }
      return className;
    },
    attributes: {
      "aria-hidden": "true"
    },
    template: wizardTemplate,
    behaviors: {
      TabablesBehavior: {
        behaviorClass: WizardTabableBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    regions: {
      body: {
        selector: ".binf-modal-body",
        regionClass: HorizontalSlidingRegion
      },
      header: ".binf-modal-header",
      footer: ".binf-modal-footer"
    },
    ui: {
      dialog: ".binf-modal-dialog",
      header: ".binf-modal-header",
      footer: ".binf-modal-footer"
    },
    events: {
      "shown.binf.modal": "_onModalShown",
      "click .cs-close": "_onClickCancel",
      keyup: "_onKeyInView",
      mouseup: "_onMouseUp"
    },
    templateHelpers: function() {
      return {
        suppressHeader: this.options.suppressHeader,
        suppressFooter: this.options.suppressFooter
      };
    },
    defaultFooterButtonConfig: Object.freeze({
      previous: Object.freeze({
        id: "previous",
        disabled: false,
        hidden: false,
        align: "begin",
        skipInitialHide: false,
        iconOnly: true,
        icon: "action:action_back32",
        className: "default-back-button",
        clickHandler: function() {
          this.options.wizard && this.options.wizard.prevStep();
        }
      }),
      next: Object.freeze({
        id: "next",
        label: lang.labelNext,
        isPrimary: true,
        disabled: false,
        hidden: false,
        className: "default-next-button",
        clickHandler: function() {
          this.options.wizard && this.options.wizard.nextStep();
        }
      }),
      cancel: Object.freeze({
        id: "cancel",
        label: lang.labelCancel,
        disabled: false,
        hidden: false,
        className: "default-cancel-button",
        clickHandler: function() {
          this.options.wizard && this.options.wizard.cancel();
        }
      })
    }),
    doneHandler: function() {
      this.options.wizard && this.options.wizard.close();
    },
    constructor: function StepperWizardView(options) {
      manageWizardSize(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "wizard:state:minimize", this.minimize);
      this.listenTo(this, "wizard:state:restore", this.restore);
      this.listenTo(this, "wizard:close", this.close);
      this.listenTo(Session.get(), "end", this.close);
      this._getGlobalEventChannel().vent.on("module:change", this._forceCancel, this);
      this._getEventChannel().vent.on("wizard:state:restore", this._channelRestore, this);
      this._getEventChannel().vent.on("wizard:close", this._channelClose, this);
      this.propagateEventsToRegions();
      return this;
    },
    initialize: function() {
      this.usePreviousStepTitleAsBackButtonTooltip = _.isBoolean(this.options.usePreviousStepTitleAsBackButtonTooltip) ? this.options.usePreviousStepTitleAsBackButtonTooltip : true;
      this.showPageLeavingWarning = _.isBoolean(this.options.showPageLeavingWarning) ? this.options.showPageLeavingWarning : true;
      this.stepTitleStack = [];
      this.data = this.options.data || {};
      this.data.wizard = this;
      this.steps = {};
      this.previousStepMappings = {};
      for (var idx = 0; idx < this.options.steps.length; idx++) {
        var step = this.options.steps[idx];
        if (!step.id) {
          throw Error("each step must have an id");
        } else {
          var existing = this.steps[step.id];
          if (existing) {
            throw Error("step id duplicated [" + step.id + "]");
          } else {
            var hidePrevButton = false, nextButtonClosesWizard = false;
            if (!_.isString(step.nextStepId) && !_.isFunction(step.nextStepId)) {
              if (idx + 1 <= this.options.steps.length - 1) {
                step.nextStepId = this.options.steps[idx + 1].id;
              } else {
                nextButtonClosesWizard = true;
              }
            }
            step.buttons = this._getNormalizedButtons(step.buttons, hidePrevButton, nextButtonClosesWizard);
            step.viewOptions = step.viewOptions || {};
            var mStep = new Marionette.Object(_.extend({}, this.data, _.omit(step.viewOptions, "wizard"))), stepOptions = _.omit(step, "view", "viewOptions");
            stepOptions.transient = _.isBoolean(stepOptions.transient) ? stepOptions.transient : false;
            mStep.mergeOptions(stepOptions, _.keys(stepOptions));
            this.steps[step.id] = mStep;
          }
        }
      }
      this._initStates();
    },
    _initStates: function() {
      this.currentStep = this.options.steps[0].id;
      this.isMinimized = false;
      this.isVisible = false;
      this.isClosing = false;
    },
    _getNormalizedButtons: function(buttons, hidePreviousButton, nextButtonClosesWizard) {
      if (!_.isUndefined(buttons) && !_.isArray(buttons)) {
        throw Error("Buttons must be specified as an array");
      }
      buttons = buttons || [];
      var prevButton, nextButton, cancelButton, leftButtons = [], rightButtons = [];
      _.each(buttons, function(btn) {
        if (!btn.id) {
          throw Error("Each button must have an id");
        }
        var button = _.extend({
          isPrimary: false,
          disabled: false,
          hidden: false,
          className: ""
        }, this.defaultFooterButtonConfig[btn.id], _.omit(btn, "align", "className"));
        if (!_.isEmpty(btn.className)) {
          button.className += " " + btn.className;
        }
        if (!this.defaultFooterButtonConfig[btn.id]) {
          button.align = btn.align;
        }
        if (button.id === "previous") {
          prevButton = button;
        } else if (button.id === "next") {
          nextButton = button;
        } else if (button.id === "cancel") {
          cancelButton = button;
        }
        if (button.align === "begin") {
          leftButtons.push(button);
        } else {
          rightButtons.splice(0, 0, button);
        }
      }.bind(this));
      var nButtons = leftButtons.concat(rightButtons);
      if (!prevButton) {
        prevButton = _.extend({}, this.defaultFooterButtonConfig.previous, {
          hidden: hidePreviousButton
        });
        nButtons.splice(0, 0, prevButton);
      }
      if (!nextButton) {
        nextButton = _.extend({}, this.defaultFooterButtonConfig.next);
        nButtons.push(nextButton);
      }
      if (nextButtonClosesWizard && stepperUtil.areSameFunctions(nextButton.clickHandler, this.defaultFooterButtonConfig.next.clickHandler)) {
        nextButton.clickHandler = this.doneHandler;
      }
      if (!cancelButton) {
        cancelButton = _.extend({}, this.defaultFooterButtonConfig.cancel);
        nButtons.push(cancelButton);
      }
      return nButtons;
    },
    _onKeyInView: function(event) {
      if (event.keyCode === 27 && !event.isDefaultPrevented()) {
        this._onClickCancel(event);
      }
    },
    onToolbarBGTaskViewManagerClick: function(clientId) {
      if (clientId === this.minimizedState.control.clientId) {
        this.restore();
      }
    },
    show: function(stepId) {
      if (!this.isVisible) {
        if (stepId && !!this.steps[stepId]) {
          this.currentStep = stepId;
        }
        this._hideButton(this.currentStep, "previous");
        var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
          el: container
        });
        region.show(this);
      }
      return this;
    },
    isMinimizable: function() {
      return !BGTaskViewManager.isToolbarTaskViewRunning();
    },
    minimize: function(options) {
      var promise = options.promise;
      if (this.isVisible && !this.isMinimized) {
        if (stepperUtil.isJqueryPromise(promise)) {
          var taskControl = BGTaskViewManager.addTask(options);
          if (!taskControl) {
            return false;
          } else {
            this.minimizedState = {
              control: taskControl
            };
            this.listenTo(taskControl, "restore:wizard", this.onToolbarBGTaskViewManagerClick.bind(this));
          }
        }
        this.isMinimized = true;
        this.$el.one("hidden.binf.modal", function() {
          this.trigger("wizard:minimized");
          this._triggerEventOnChannel("wizard:minimized");
        }.bind(this));
        this.$el.binf_modal("hide");
      }
      return true;
    },
    restore: function() {
      this._cleanUpMinimizedStateIfAny();
      if (this.isVisible && this.isMinimized) {
        this.onShow();
      }
    },
    _cleanUpMinimizedStateIfAny: function() {
      if (this.minimizedState) {
        this.stopListening(this.minimizedState.control, "restore:wizard");
        delete this.minimizedState.control;
        delete this.minimizedState;
      }
    },
    _channelRestore: function(wizardId) {
      if (this._isThisWizard(wizardId)) {
        this.restore();
      }
    },
    onRender: function() {
      this.$el.addClass(StepperWizardView.prototype.className.apply(this));
      if (base.isIE11()) {
        this.$el.addClass("fix-msie");
      }
      this._renderHeader();
      this._renderFooter();
      if (!this.blockingParentView) {
        this.blockingParentView = new Marionette.ItemView({
          el: this.ui.dialog[0],
          template: false
        });
        BlockingView.imbue(this.blockingParentView);
        this.blockingParentView.render();
      }
    },
    onShow: function() {
      this.isVisible = true;
      $(window).scrollTop(0);
      this.$el.binf_modal({
        backdrop: "static",
        keyboard: false,
        paddingWhenOverflowing: false
      });
      this.$el.off("hide.binf.modal.sw").on("hide.binf.modal.sw", function() {
        this.$el.removeClass("binf-in");
      }.bind(this));
      if (!this.isMinimized) {
        if (this.showPageLeavingWarning) {
          pageLeavingBlocker.enable(lang.pageLeavingWarning);
        }
        $(window).on("unload.stepperwizard", this._onForceClose.bind(this));
        this._renderCurrentStep(true);
      }
    },
    destroy: function() {
      if (this.$el.is(":visible")) {
        this.$el.one("hidden.binf.modal", this.destroy.bind(this));
        this.$el.binf_modal("hide");
      } else {
        if (this.showPageLeavingWarning) {
          pageLeavingBlocker.disable();
        }
        $(window).off("unload.stepperwizard");
        StepperWizardView.__super__.destroy.apply(this, arguments);
      }
      return this;
    },
    onBeforeDestroy: function() {
      this._getEventChannel().vent.off(null, null, this);
      this._getGlobalEventChannel().vent.off(null, null, this);
      this._cleanUpMinimizedStateIfAny();
      if (this.headerView) {
        this.headerView.destroy();
      }
      if (this.footerView) {
        this.footerView.destroy();
      }
      if (this.blockingParentView) {
        this.blockingParentView.destroy();
      }
      _.each(_.keys(this.steps), function(stepId) {
        this.steps[stepId].view && this.steps[stepId].view.destroy();
        this.steps[stepId].destroy && this.steps[stepId].destroy();
        delete this.steps[stepId];
      }.bind(this));
    },
    _onModalShown: function() {
      if (!this.isMinimized) {
        this.trigger("wizard:shown");
        this._triggerEventOnChannel("wizard:shown");
      } else {
        this.isMinimized = false;
        this.trigger("wizard:restored");
        this._triggerEventOnChannel("wizard:restored");
      }
      this._triggerDomRefreshOnView(this.headerView);
      this._triggerDomRefreshOnView(this.footerView);
      this._triggerDomRefreshOnView(this.steps[this.currentStep].view);
    },
    _triggerDomRefreshOnView: function(view) {
      view && view.triggerMethod && view.triggerMethod("dom:refresh");
    },
    _onForceClose: function() {
      this._close("wizard:forceclose");
    },
    _onClickCancel: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var attributes = {
        id: "cancel",
        label: lang.labelClose,
        clickHandler: this.cancel.bind(this)
      };
      this._onButtonClick(attributes);
    },
    cancel: function() {
      if (this.isVisible && !this.isClosing) {
        this.isClosing = true;
        var step = this.steps[this.currentStep], retVal = stepperUtil.evaluateProperty("onCancel", step, step.view), args = Array.prototype.slice.call(arguments);
        if (stepperUtil.isJqueryPromise(retVal)) {
          retVal.done(function() {
            StepperWizardView.prototype._cancel.apply(this, args);
          }.bind(this)).fail(function() {
            this.isClosing = false;
          }.bind(this));
          return;
        }
        StepperWizardView.prototype._cancel.apply(this, args);
      }
    },
    _cancel: function() {
      if (this.isClosing) {
        this._close("wizard:closed", true, arguments);
      }
    },
    _forceCancel: function() {
      this.isClosing = true;
      this._cancel.apply(this, arguments);
    },
    close: function() {
      if (this.isVisible) {
        this._close("wizard:closed", false, arguments);
      }
    },
    _channelClose: function(wizardId) {
      if (this._isThisWizard(wizardId)) {
        this.close();
      }
    },
    _close: function(eventName, isCancelled, eventArgs) {
      eventArgs = _.isArguments(eventArgs) ? Array.prototype.slice.call(eventArgs) : eventArgs;
      var args = [ eventName, isCancelled !== false ];
      if (_.isArray(eventArgs)) {
        args = args.concat(eventArgs);
      }
      StepperWizardView.prototype.trigger.apply(this, args);
      var eventAggregator = this._getEventChannel().vent;
      args.splice(2, 0, this.getId());
      eventAggregator.trigger.apply(eventAggregator, args);
      this.destroy();
    },
    _renderHeader: function() {
      if (this.options.suppressHeader !== true) {
        this.headerView = _.isFunction(this.options.StepHeaderView) ? new this.options.StepHeaderView(this.options) : new StepHeaderView();
        this.header.show(this.headerView);
      }
    },
    _renderFooter: function() {
      if (this.options.suppressFooter !== true) {
        this.footerView = new StepFooterView({
          collection: new Backbone.Collection([])
        });
        this.listenTo(this.footerView, "childview:mouseup", this._onFooterButtonClick);
        this.listenTo(this.footerView, "childview:mousedown", this._onFooterButtonMouseDown);
        this.listenTo(this.footerView, "childview:keyup", this._onFooterButtonKeyUp);
        this.listenTo(this.footerView, "childview:click", this._onFooterButtonClick);
        this.footer.show(this.footerView);
      }
    },
    _onFooterButtonKeyUp: function(view, event) {
      switch (event.which) {
       case 13:
       case 32:
        this.mouseDownView = view;
        this._onFooterButtonClick(view);
        break;
      }
    },
    _onFooterButtonClick: function(view) {
      if (!this.body.animating && this.mouseDownView === view) {
        var attributes = view.model.attributes;
        this._onButtonClick(attributes);
      }
      this.mouseDownView = null;
    },
    _onFooterButtonMouseDown: function(view) {
      this.mouseDownView = view;
      return false;
    },
    _onMouseUp: function() {
      this.mouseDownView = null;
    },
    nextStep: function() {
      this._nextPrevStep("nextStepId", true);
    },
    prevStep: function() {
      this._nextPrevStep("previousStepId", false);
    },
    gotoStep: function(stepId, animateFromEnd) {
      if (stepId && !!this.steps[stepId]) {
        var step = this.steps[this.currentStep], animationDirectionFromEnd = _.isBoolean(animateFromEnd) ? animateFromEnd : true;
        if (animationDirectionFromEnd === true) {
          if (step.transient === false) {
            this.previousStepMappings[stepId] = this.currentStep;
          } else {
            var fallbackStepId = this.currentStep;
            while (fallbackStepId && this.steps[fallbackStepId].transient === true) {
              fallbackStepId = this.previousStepMappings[fallbackStepId];
            }
            this.previousStepMappings[stepId] = fallbackStepId;
          }
        }
        this._hideCurrentView();
        this.currentStep = stepId;
        this._renderCurrentStep(animationDirectionFromEnd, step);
      }
    },
    refreshHeader: function() {
      if (this.headerView) {
        this.headerView.refresh();
      }
    },
    refreshFooter: function(buttonIds) {
      if (this.footerView) {
        if (buttonIds?.includes("next")) buttonIds.push("buttonOk");
        this.footerView.refresh(buttonIds);
      }
    },
    getData: function() {
      return _.omit(this.data, "wizard");
    },
    getId: function() {
      return this.cid;
    },
    _nextPrevStep: function(propName, animationDirectionFromEnd) {
      var step = this.steps[this.currentStep], followingStepId = stepperUtil.evaluateProperty(propName, step, step.view);
      if (followingStepId === "finish") {
        this.close();
        return;
      }
      if (animationDirectionFromEnd === false && !followingStepId) {
        followingStepId = this.previousStepMappings[this.currentStep];
      }
      this.gotoStep(followingStepId, animationDirectionFromEnd);
    },
    _hideCurrentView: function() {
      if (this.currentView) {
        this.currentView.triggerMethod("step:before:inactive");
        this.body.empty({
          preventDestroy: true
        });
      }
    },
    _listenForExceptionsInSteps: function() {
      var isFetchingFailed = false, viewTransitioned = false;
      function isFetchingFailedAndViewTransitioned() {
        if (isFetchingFailed && viewTransitioned) {
          this._showExceptionView();
        }
      }
      this.listenToOnce(this.currentView, "external:request:failed", () => {
        isFetchingFailed = true;
        isFetchingFailedAndViewTransitioned.call(this);
      });
      this.listenToOnce(this, "wizard:step:transitioned", () => {
        viewTransitioned = true;
        isFetchingFailedAndViewTransitioned.call(this);
      });
    },
    _showCurrentView: function(isAnimationDirectionFromEnd) {
      if (this.currentView) {
        this.body.animationDirectionFromEnd = isAnimationDirectionFromEnd;
        this.currentView.triggerMethod("step:before:active");
        this._listenForExceptionsInSteps();
        this.body.show(this.currentView, {
          render: !this.currentView._isRendered
        });
      }
    },
    _getExceptionViewStep: function() {
      let stepOptions = {
        buttons: this._getNormalizedButtons([ {
          id: "previous",
          hidden: this.isPreviousStepExists() === false
        }, {
          id: "cancel",
          hidden: false
        }, {
          id: "next",
          hidden: true
        } ], false, false),
        id: "exception",
        title: () => {
          return this.headerView.getTitle();
        },
        viewClass: D2HeaderMessageView
      }, mStep = new Marionette.Object(_.extend({}, {
        message: this.isPreviousStepExists() ? lang.exceptionViewHeaderMessageWithPrevStep : lang.exceptionViewHeaderMessageWithNoPrevStep,
        mode: "error"
      }, stepOptions));
      mStep.mergeOptions(stepOptions, _.keys(stepOptions));
      return mStep;
    },
    isPreviousStepExists: function() {
      let currentStepButtons = this.steps[this.currentStep].buttons;
      return !_.findWhere(currentStepButtons, {
        id: "previous"
      }).hidden;
    },
    _showExceptionView: function() {
      this._hideCurrentView();
      this._renderCurrentStep(true, {}, true);
      this.unblockActions();
    },
    _renderCurrentStep: function(isAnimationDirectionFromEnd, lastStep, shouldRenderExceptionView = false) {
      var step = shouldRenderExceptionView ? this._getExceptionViewStep() : this.steps[this.currentStep], lastStepTitle;
      if (!step.view || step.view.isDestroyed) {
        step.view = new step.viewClass(step.options);
      }
      step.triggerMethod("refresh");
      if (this.headerView) {
        lastStepTitle = this.headerView.getTitle();
        this.headerView.setStep(step);
        this._triggerDomRefreshOnView(this.headerView);
      }
      if (isAnimationDirectionFromEnd) {
        if (lastStep && lastStep.transient === false) {
          this.stepTitleStack.push(lastStepTitle);
        }
      } else {
        this.stepTitleStack.pop();
      }
      if (this.footerView) {
        var backButton = _.find(step.buttons, function(button) {
          return button.id === "previous";
        });
        if (backButton) {
          backButton.defaultTooltip = this.usePreviousStepTitleAsBackButtonTooltip && _.last(this.stepTitleStack) || lang.labelPrevious;
        }
        this.footerView.setStep(step);
        this._triggerDomRefreshOnView(this.footerView);
      }
      this.currentView = step.view;
      this._showCurrentView(isAnimationDirectionFromEnd);
    },
    _onButtonClick: function(buttonAttributes) {
      var fnClickHandler = buttonAttributes.clickHandler;
      if (_.isFunction(fnClickHandler)) {
        fnClickHandler.call(this.steps[this.currentStep].view);
      }
    },
    _isThisWizard: function(wizardId) {
      return wizardId === this.getId();
    },
    _triggerEventOnChannel: function(eventName) {
      this._getEventChannel().vent.trigger(eventName, this.getId());
    },
    _getEventChannel: function() {
      return Backbone.Wreqr.radio.channel("stepper_wizard");
    },
    _getGlobalEventChannel: function() {
      return Backbone.Wreqr.radio.channel("application");
    },
    _hideButton: function(stepId, btnId) {
      if (stepId && this.steps[stepId] && btnId) {
        var btn = _.find(this.steps[stepId].buttons, function(button) {
          return button.id === btnId;
        });
        if (btn && !btn.skipInitialHide) {
          btn.hidden = true;
        }
      }
    },
    blockActions: function() {
      if (this.blockingParentView) {
        this.blockingParentView.blockActions();
      }
    },
    unblockActions: function() {
      if (this.blockingParentView) {
        this.blockingParentView.unblockActions();
      }
    }
  });
  _.extend(StepperWizardView.prototype, LayoutViewEventsPropagationMixin);
  return StepperWizardView;
});