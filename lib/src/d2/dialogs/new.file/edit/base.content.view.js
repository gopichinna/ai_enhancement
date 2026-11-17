/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Marionette from "nuc/lib/marionette";

import WizardTabableRegionBehavior from "d2/controls/behaviors/wizard.tabable.region.behavior";

import HeaderMessageView from "d2/dialogs/new.file/edit/header.message.view";

import utils from "dctmw/utils/utils";

import template from "hbs!d2/dialogs/new.file/edit/impl/base.content";

import lang from "i18n!d2/dialogs/new.file/edit/impl/nls/lang";

import "css!d2/dialogs/new.file/edit/impl/base.content";

class BaseContentView extends Marionette.LayoutView {
  template = template;
  className() {
    return "d2-base-content";
  }
  templateHelpers() {
    return {
      mode: this.mode || "",
      mainMessage: this.mainMessage || "",
      informationalMessage: this.informationalMessage || ""
    };
  }
  behaviors() {
    return {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    };
  }
  constructor(options = {}) {
    super(options);
  }
  prependMessage(mode, message) {
    if (mode && message) {
      this.$el.find(".d2-header-message-container." + mode).remove();
      const messageView = new HeaderMessageView({
        message: message,
        mode: mode
      });
      messageView.render();
      this.$el.prepend(messageView.$el);
    }
  }
  renderMessage(mode, mainMessage, informationalMessage) {
    this.mode = mode;
    this.mainMessage = mainMessage;
    this.informationalMessage = informationalMessage;
    this.render();
  }
  getErrorMessage(error) {
    let errorMessage;
    if (error) {
      if (_.isString(error)) {
        errorMessage = error;
      } else if (error.responseText) {
        errorMessage = utils.parseAjaxErrorAsString(error);
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    return errorMessage;
  }
  getCancelLabel() {
    return lang.CancelLabel;
  }
  onShow() {
    this.$el.closest(".d2-wizard-step-view").css("top", "0");
  }
}

Object.defineProperty(BaseContentView.prototype.constructor, "name", {
  value: "BaseContentView"
});

export default BaseContentView;