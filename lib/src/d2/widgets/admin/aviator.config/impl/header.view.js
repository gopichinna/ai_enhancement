/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import {
  Collection
} from "nuc/lib/backbone";

import {
  CompositeView
} from "nuc/lib/marionette";

import BlockingView from "smart/controls/progressblocker/blocker";

import commands from "csui/utils/commands";

import ButtonView from "dctmw/controls/otwc/otwc.button.view";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import AviatorAssignmentsCollectionFactory from "d2/utils/contexts/factories/aviator.assignments.collection.factory";

import template from "hbs!d2/widgets/admin/aviator.config/impl/header";

import lang from "i18n!d2/widgets/admin/aviator.config/impl/nls/lang";

import "css!d2/widgets/admin/aviator.config/impl/header";

class AviatorHeaderView extends CompositeView {
  template = template;
  childViewContainer = ">.av4r-header-buttons";
  childView = ButtonView;
  childEvents = {
    click: "_onHeaderButtonClick"
  };
  constructor(options = {}) {
    options.collection = new Collection([ {
      attr_disabled: true,
      attr_type: "primary",
      attr_label: lang.labelButtonSave,
      command: "Aviator-SaveConfig"
    }, {
      attr_disabled: true,
      attr_type: "secondary",
      attr_label: lang.labelButtonReset,
      command: "Aviator-ResetConfig"
    } ]);
    super(options);
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.configModel = options.config || options.context.getModel(AviatorConfigModelFactory);
    this.aviatorCollection = options.aviatorCollection || options.context.getCollection(AviatorAssignmentsCollectionFactory);
    this.listenTo(this.configModel, "change:is_enabled", this.evaluateDirtyState).listenTo(this.configModel, "request", this._onConfigModelRequest).listenTo(this.aviatorCollection, "add remove reset", this._aviatorCollectionChange);
  }
  _aviatorCollectionChange() {
    this.evaluateDirtyState();
  }
  templateHelpers() {
    return {
      title: lang.titleHeader
    };
  }
  className() {
    return "av4r-config-header";
  }
  _onConfigModelRequest() {
    this.blockActions();
    this.clearDirtyState();
    this.listenToOnce(this.configModel, "sync error", () => {
      this.evaluateDirtyState();
      this.unblockActions();
    });
  }
  _onHeaderButtonClick(childView) {
    const commandSignature = childView.model?.get("command");
    const command = commands.get(commandSignature);
    if (command) {
      this.listenToOnce(this.configModel, "av4r:config:save:start", this.#onActionStart).listenToOnce(this.configModel, "av4r:config:save:end", this.#onActionEnd);
      command.execute({
        context: this.options.context
      });
    }
  }
  evaluateDirtyState() {
    const av4rStatus = this.configModel.get("is_enabled"), av4rServerStatus = this.configModel.getServerAttribute("is_enabled"), isCollectionDirty = this.aviatorCollection.isDirtyCollection;
    if (av4rStatus !== av4rServerStatus || isCollectionDirty) {
      this.setDirtyState();
    } else {
      this.clearDirtyState();
    }
  }
  setDirtyState() {
    this.#updateDisabledState(false);
    this.#applyMask();
    $(window).off(this.#unloadEventQualifier()).on(this.#unloadEventQualifier(), () => {
      return true;
    });
  }
  clearDirtyState() {
    this.#clearMask();
    $(window).off(this.#unloadEventQualifier());
    this.#updateDisabledState(true);
  }
  #onActionStart() {
    this.#updateDisabledState(true);
    this.#clearMask();
  }
  #onActionEnd() {
    this.evaluateDirtyState();
  }
  #updateDisabledState(state) {
    this.collection.each(model => {
      model.set("attr_disabled", state);
    });
  }
  #applyMask() {
    if (this.maskingDivs && this.maskingDivs.length) {
      return;
    }
    this.maskingDivs = $();
    const maskDivTemplate = $('<div class="av4r-edit-mask"/>');
    const navbarClass = $("body").find(".d2-navbar").length > 0 ? "d2-navbar" : "binf-navbar-default";
    this.maskingDivs = this.maskingDivs.add(maskDivTemplate.prependTo($("body").find("." + navbarClass)));
  }
  #clearMask() {
    if (this.maskingDivs) {
      this.maskingDivs.remove();
      this.maskingDivs = undefined;
    }
  }
  #unloadEventQualifier() {
    return `beforeunload.aviator_config_${this.cid}`;
  }
}

Object.defineProperty(AviatorHeaderView.prototype.constructor, "name", {
  value: "AviatorHeaderView"
});

export default AviatorHeaderView;