/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import i18n from "i18n";

import Av4rTabPanelView from "d2/dialogs/modal.aviator.summary/impl/aviator.summary.tab.view";

import CustomizableModalAlert from "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert";

import template from "hbs!d2/dialogs/modal.aviator.summary/impl/aviator.summary";

import lang from "i18n!d2/dialogs/modal.aviator.summary/impl/nls/lang";

import "css!d2/dialogs/modal.aviator.summary/impl/aviator.summary.dialog";

import "smart/lib/binf/js/binf";

class AviatorSummaryModalDialog extends CustomizableModalAlert {
  constructor(options = {}) {
    super(options);
    this.isAlertTypeWarning = options.isAlertTypeWarning;
  }
  getTemplate() {
    return template;
  }
  className() {
    return "alert-av4r-summary-view " + super.className();
  }
  onRender() {
    super.onRender && super.onRender();
    this.isAlertTypeWarning && $(this.ui.warnTipPopoverHandle).binf_popover({
      content: `<span>${lang.aviatorDisablingWarningTooltipMessage}</span>`,
      html: true,
      container: $.fn.binf_modal.getDefaultContainer(),
      template: '<div class="binf-popover bordered-popover av4r-disabling-warn-popover" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
      placement: i18n.settings.rtl ? "left" : "right"
    });
  }
  onBeforeDestroy() {
    this.#triggerMethodOnWarnTipPopover("destroy");
    super.onBeforeDestroy && super.onBeforeDestroy();
  }
  _onFocusOut() {
    this.#triggerMethodOnWarnTipPopover("hide");
  }
  #triggerMethodOnWarnTipPopover(method) {
    this.isAlertTypeWarning && this.ui.warnTipPopoverHandle.length && this.ui.warnTipPopoverHandle.binf_popover(method);
  }
  static _show(options) {
    const alert = new AviatorSummaryModalDialog(options);
    return alert.show();
  }
  static showConfirmationDialog(status) {
    return new Promise((resolve, reject) => {
      const buttonOptions = {
        showYes: true,
        labelYes: lang.aviatorConfigSaveBtn,
        labelCancel: lang.aviatorConfigCancelBtn,
        showNo: false,
        showCancel: true
      };
      const {
        configModel
      } = status, serverState = configModel.getServerAttribute("is_enabled"), clientState = configModel.get("is_enabled");
      let message = "", assignmentsCollection = status.assignmentsCollection, hasAssignmentUpdate = assignmentsCollection.locallyAddedAssignments.length > 0 || assignmentsCollection.locallyRemovedAssignments.length > 0, isAlertTypeWarning = false;
      if (serverState !== clientState) {
        message = clientState ? lang.aviatorStatusEnableLabel : lang.aviatorStatusDisableLabel;
        isAlertTypeWarning = !clientState && status.assignmentsCollection.length > 0;
      }
      let dialogClass = "";
      if (!hasAssignmentUpdate) {
        dialogClass += " message-dialog";
      }
      const args = [ result => {
        result ? resolve() : reject();
      }, message, lang.aviatorChangeSummaryDialogTitle, {
        buttons: buttonOptions,
        contentView: new Av4rTabPanelView(_.defaults({}, status)),
        modalClass: dialogClass,
        isAlertTypeWarning: isAlertTypeWarning
      } ];
      AviatorSummaryModalDialog[isAlertTypeWarning ? "confirmWarning" : "confirmInformation"].apply(AviatorSummaryModalDialog, args);
    });
  }
}

Object.defineProperty(AviatorSummaryModalDialog.prototype.constructor, "name", {
  value: "AviatorSummaryModalDialog"
});

Object.assign(AviatorSummaryModalDialog.prototype, {
  ui: Object.assign(AviatorSummaryModalDialog.prototype.ui, {
    warnTipPopoverHandle: ".status-container .icon"
  }),
  events: Object.assign(AviatorSummaryModalDialog.prototype.events, {
    focusout: "_onFocusOut"
  })
});

export default AviatorSummaryModalDialog;