/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import Session from "dctmw/utils/authenticators/session";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import AssignmentsTableView from "d2/widgets/admin/aviator.config/assignments.table.view";

import template from "hbs!d2/widgets/admin/aviator.config/impl/aviator.config.assignments";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

import "css!d2/widgets/admin/aviator.config/impl/aviator.config.assignments";

import "smart/lib/binf/js/binf";

class AviatorConfigAssignmentsView extends LayoutView {
  template = template;
  className() {
    return "av4r-config-assignments";
  }
  templateHelpers() {
    return {
      header: lang.headerTabAssignments
    };
  }
  regions() {
    return {
      rgnContent: ".av4r-config-assignments-content"
    };
  }
  ui() {
    return {
      headerInfoTip: ".header-info-tip"
    };
  }
  events() {
    return {
      "keyup @ui.headerInfoTip": "_handleKeyupOnHeaderInfoTip",
      focusout: "_onFocusOut"
    };
  }
  constructor(options = {}) {
    super(options);
    this.propagateEventsToRegions();
    const context = options.context || Session.get().getContext();
    this.configModel = options.config || context.getModel(AviatorConfigModelFactory);
  }
  onRender() {
    if (!this.contentView) {
      this.contentView = new AssignmentsTableView(_.defaults({
        originatingView: this
      }, this.options));
    }
    this.rgnContent.show(this.contentView);
  }
  _onFocusOut() {
    this.#triggerMethodOnInfoTipPopover("hide");
  }
  _handleKeyupOnHeaderInfoTip(event) {
    if (event?.keyCode === 13 || event?.keyCode === 32) {
      this.#triggerMethodOnInfoTipPopover("toggle");
    }
  }
  #triggerMethodOnInfoTipPopover(method) {
    this.ui.headerInfoTip.length && this.ui.headerInfoTip.binf_popover(method);
  }
  onBeforeDestroy() {
    this.#triggerMethodOnInfoTipPopover("destroy");
    this.contentView && this.contentView.destroy();
  }
}

Object.assign(AviatorConfigAssignmentsView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(AviatorConfigAssignmentsView.prototype.constructor, "name", {
  value: "AviatorConfigAssignmentsView"
});

export default AviatorConfigAssignmentsView;