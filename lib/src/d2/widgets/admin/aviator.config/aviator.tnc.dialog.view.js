/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  LayoutView
} from "nuc/lib/marionette";

import SidePanelView from "smart/controls/side.panel/side.panel.view";

import smartBase from "smart/utils/smart.base";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

import template from "hbs!d2/widgets/admin/aviator.config/impl/aviator.tnc.dialog.content";

import "css!d2/widgets/admin/aviator.config/impl/aviator.tnc.dialog.content";

class AviatorTncDialogContent extends LayoutView {
  template = template;
  className() {
    return "av4r-tnc-dialog-content";
  }
  templateHelpers() {
    return {
      content: lang.tncDialogContent
    };
  }
}

class AviatorTncDialogView extends SidePanelView {
  #resolutionDfd;
  #accepted = false;
  constructor(options = {}) {
    const mode = _.values(AviatorTncDialogView.MODES).includes(options.mode) ? options.mode : AviatorTncDialogView.MODES.REVIEW;
    options.title = lang.titleTnCDialog;
    options.layout = {
      size: "custom",
      resize: false
    };
    options.content = new AviatorTncDialogContent();
    options.sidePanelClassName = "av4r-tnc-dialog-view";
    options.buttons = [ {
      variant: "secondary",
      type: "cancel",
      id: "cancel",
      label: lang.lavelTncCancelButton
    } ];
    if (mode === AviatorTncDialogView.MODES.ACCEPTANCE) {
      options.buttons.unshift({
        variant: "primary",
        type: "action",
        id: "accept",
        label: lang.labelTncAcceptButton
      });
    }
    super(options);
    this.listenToOnce(this, "render", () => {
      this.listenTo(this.footerView, "button:click:action", btnAttr => {
        if (btnAttr.id === "accept") {
          this.#accepted = true;
          this.hide();
        }
      });
    });
  }
  show(callback) {
    this.#resolutionDfd = $.Deferred();
    return super.show(callback);
  }
  doHide(afterHideCallback) {
    return super.doHide(() => {
      _.isFunction(afterHideCallback) && afterHideCallback.call(this);
      if (this.#accepted === true) {
        this.#resolutionDfd?.resolve();
      } else {
        this.#resolutionDfd?.reject();
      }
    });
  }
  getResolutionPromise() {
    return this.#resolutionDfd?.promise();
  }
  onSetFocus() {
    var contFocusableElements = smartBase.findFocusables(this.ui?.container);
    var bodyFocusableElements = smartBase.findFocusables(this.ui?.body);
    if (bodyFocusableElements.length === 0) {
      bodyFocusableElements?.first().trigger("focus");
    } else {
      contFocusableElements?.first().trigger("focus");
    }
  }
}

Object.assign(AviatorTncDialogView, {
  MODES: Object.freeze({
    ACCEPTANCE: "acceptance",
    REVIEW: "review"
  })
});

Object.defineProperty(AviatorTncDialogView.prototype.constructor, "name", {
  value: "AviatorTncDialogView"
});

export default AviatorTncDialogView;