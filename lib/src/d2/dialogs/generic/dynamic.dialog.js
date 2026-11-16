/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  View
} from "nuc/lib/marionette";

import NonEmptyingRegion from "csui/utils/non-emptying.region/non-emptying.region";

import PubSub from "csui/controls/form/pub.sub";

import CommandHelper from "csui/utils/commandhelper";

import StepperWizard from "d2/controls/stepper.wizard/stepper.wizard.view";

import DialogState from "d2/dialogs/generic/dialog.state";

import dialogContentViewResolver from "d2/dialogs/generic/dialog.content.view.resolver";

import dialogActions from "d2/dialogs/generic/dialog.action.collection";

import constants from "d2/utils/constants";

import lang from "i18n!d2/controls/stepper.wizard/impl/nls/lang";

class DynamicDialog extends StepperWizard {
  constructor(options = {}) {
    super(options);
  }
  initialize() {
    this.dialogState = new DialogState(this.options);
    this.steps = {};
    this.previousStepMappings = {};
    this.stepTitleStack = [];
    this.listenTo(PubSub, "d2:form:expression:executed", this._formExpressionExecuted);
  }
  _validateStepId(stepId) {
    return _.isString(stepId) && !_.isEmpty(stepId);
  }
  show(stepId) {
    if (!this.isVisible) {
      if (!this._validateStepId(stepId)) {
        stepId = this?.options?.name;
      }
      if (!this._validateStepId(stepId)) {
        throw new Error("Unknown beginning step, either pass a 'stepId' or set 'name' in constructor options");
      }
      this.currentStep = stepId;
      this._hideButton(this.currentStep, "previous");
      var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this);
    }
    return this;
  }
  gotoStep(stepId) {
    if (stepId) {
      if (stepId === "finish") {
        this.close();
        return;
      }
      const lastStep = this.steps[this.currentStep];
      this.currentStep = stepId;
      this._hideCurrentView();
      this._renderCurrentStep(this.dialogState.getRelativeFormPosition(lastStep.id, this.currentStep), lastStep);
    }
  }
  _renderCurrentStep(isAnimationDirectionFromEnd, lastStep) {
    this.blockActions();
    this.dialogState.gotoForm(this.currentStep).then(formData => {
      formData.layoutMode = this.options.viewMode === constants.WizardType.SIDE_PANEL ? "singleCol" : null;
      return new Promise((res, rej) => {
        dialogContentViewResolver.resolveView(formData).then(view => res({
          formData: formData,
          view: view
        })).catch(rej);
      });
    }).then(this._buildDynamicStep.bind(this)).then(() => {
      this._adoptCurrentStep(isAnimationDirectionFromEnd, lastStep);
      this._showCurrentView(isAnimationDirectionFromEnd);
    }).catch(e => {
      this.cancel();
      this.handleError(e);
    }).finally(this.unblockActions.bind(this));
  }
  _buildDynamicStep(options) {
    let {
      formData: {
        formName,
        formSchema
      },
      view
    } = options;
    return new Promise((res, rej) => {
      if (typeof view === "function") {
        view = new view(options.formData);
      }
      if (!(view instanceof View)) {
        rej("A marionette view was not found");
        return;
      }
      this.currentStep = formName;
      this.steps[this.currentStep] = {
        id: this.currentStep,
        title: formSchema?.generalConfig.title,
        buttons: formSchema?.generalConfig.buttons || [],
        view: view,
        formData: options.formData
      };
      res(options);
    });
  }
  _adoptCurrentStep(isAnimationDirectionFromEnd, lastStep) {
    let step = this.steps[this.currentStep], lastStepTitle;
    if (this.headerView) {
      lastStepTitle = this.headerView.getTitle();
      this.headerView.setStep(step);
      this._triggerDomRefreshOnView(this.headerView);
    }
    if (isAnimationDirectionFromEnd === true) {
      if (lastStep) {
        if (lastStep.transient === false) {
          this.stepTitleStack.push(lastStepTitle);
          this.previousStepMappings[step.id] = lastStep.id;
        } else {
          let fallbackStepId = lastStep.id;
          while (fallbackStepId && this.steps[fallbackStepId].transient === true) {
            fallbackStepId = this.previousStepMappings[fallbackStepId];
          }
          this.previousStepMappings[step.id] = fallbackStepId;
        }
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
  }
  _onModalShown() {
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
    this.currentStep && this.steps[this.currentStep] && this._triggerDomRefreshOnView(this.steps[this.currentStep].view);
  }
  _onButtonClick(buttonAttributes) {
    const formName = this.dialogState.getCurrentFormName();
    this.blockActions();
    dialogActions.findAction(formName, buttonAttributes).execute({
      formName: formName,
      button: buttonAttributes,
      formView: this.currentView,
      dialogState: this.dialogState,
      nodes: this.options.nodes,
      dialog: this
    }).catch(e => {
      this.handleError(e, {
        button: buttonAttributes,
        formData: this.steps[this.currentStep]?.formData
      });
    }).finally(() => {
      if (!this._isDestroyed) {
        this.unblockActions();
      }
    });
  }
  handleError() {
    dialogContentViewResolver.handleError.apply(dialogContentViewResolver, arguments);
  }
  minimize(promise, notificationTooltip) {
    return super.minimize(promise, notificationTooltip);
  }
  restore() {
    return super.restore();
  }
  cancel() {
    if (this.isVisible && !this.isClosing) {
      this.isClosing = true;
      super._cancel.apply(this, arguments);
    }
  }
  close(data) {
    var refreshWidget = false, refreshCheckoutState = false, locateAndRefresh = false;
    if (data?.formSchema?.success !== undefined) {
      var dialoigResult = data?.formSchema?.success;
      refreshWidget = dialoigResult?.refreshWidget === true ? true : this.options?.data?.refreshWidget === "true";
      refreshCheckoutState = dialoigResult?.refreshCheckoutState === true ? true : this.options?.data?.refreshCheckoutState === "true";
      locateAndRefresh = dialoigResult?.locateAndRefresh === true ? true : this.options?.data?.locateAndRefresh === "true";
    }
    CommandHelper.postCommandOperation({
      refreshWidget: refreshWidget,
      refreshCheckoutState: refreshCheckoutState,
      locateAndRefresh: locateAndRefresh,
      selectedNodes: this.options?.nodes,
      collection: this.options?.collection,
      context: this.options?.context,
      originatingView: this.options?.originatingView
    });
    this._processForAlertAndToastMessage(dialoigResult, this.options?.data?.DIALOG_NAME);
    return super.close();
  }
  _processForAlertAndToastMessage(dialoigResult, defaultTitle) {
    var message = dialoigResult?.message;
    if (message !== undefined && message?.type !== undefined) {
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/controls/globalmessage/globalmessage" ], function(ModalAlert, GlobalMessage) {
        if (message?.type === constants.ModelAlertTypes.ALERT) {
          var buttonOptions = {
            showYes: true,
            labelYes: lang.labelYes,
            showNo: false,
            showCancel: false
          };
          ModalAlert.showMessage(function() {}, message?.content, message?.title === undefined ? defaultTitle : message?.title, {
            buttons: buttonOptions
          });
        } else if (message?.type === constants.ModelAlertTypes.TOAST) {
          GlobalMessage.showMessage(lang.labelSuccess, message?.content);
        }
      });
    }
  }
  _formExpressionExecuted(control, methodName, value) {
    var buttonModel = this.footerView?.collection.findWhere({
      id: control
    });
    if (buttonModel) {
      switch (methodName) {
       case "setEnabled":
        buttonModel.set("disabled", !value);
        break;

       case "setVisible":
        buttonModel.set("hidden", !value);
        break;

       default:
        return;
      }
    }
    this.footerView?.refresh([ control ]);
  }
}

Object.defineProperty(DynamicDialog.prototype.constructor, "name", {
  value: "DynamicDialog"
});

export default DynamicDialog;