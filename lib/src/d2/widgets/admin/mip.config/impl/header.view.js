/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import {
  CompositeView
} from "nuc/lib/marionette";

import commands from "csui/utils/commands";

import Alert from "csui/dialogs/modal.alert/modal.alert";

import ButtonView from "dctmw/controls/otwc/otwc.button.view";

import BlockingView from "smart/controls/progressblocker/blocker";

import MipConfigModelFactory from "d2/utils/contexts/factories/mip.config.model.factory";

import template from "hbs!d2/widgets/admin/mip.config/impl/header";

import lang from "i18n!d2/widgets/admin/mip.config/impl/nls/lang";

import "css!d2/widgets/admin/mip.config/impl/header";

class MipHeaderView extends CompositeView {
  template = template;
  childViewContainer = ">.mip-header-buttons";
  childView = ButtonView;
  childEvents = {
    click: "_onHeaderButtonClick"
  };
  className() {
    return "mip-config-header";
  }
  constructor(options = {}) {
    options.collection = new Collection([ {
      attr_disabled: true,
      attr_type: "primary",
      attr_label: lang.labelButtonSave,
      command: "Mip-SaveConfig"
    }, {
      attr_disabled: false,
      attr_type: "secondary",
      attr_label: lang.labelButtonReset,
      command: "Mip-ResetConfig"
    } ]);
    super(options);
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.isDirty = false;
    this.isPartialDirty = false;
    this.isConnectionChecked = false;
    this.isTenantIdChanged = false;
    this.configModel = options.config || options.context.getModel(MipConfigModelFactory);
    this.listenTo(this.configModel, "change", this.evaluateDirtyState).listenTo(this.configModel, "request", this._onConfigModelRequest);
  }
  events() {
    return {
      "click .mip-back-arrow": "_handleBackNavOnClick"
    };
  }
  _handleBackNavOnClick(e) {
    if (!e || !e.isDefaultPrevented()) {
      var cmdGoBack = commands.get("D2-Back");
      cmdGoBack && cmdGoBack.execute({
        context: this.options.context,
        restoreLastFragment: false
      });
    }
  }
  templateHelpers() {
    return {
      title: lang.title
    };
  }
  _onHeaderButtonClick(childView) {
    let self = this;
    const commandSignature = childView.model?.get("command");
    const command = commands.get(commandSignature);
    if (command) {
      this.listenToOnce(this.configModel, "sync", this.#onActionEnd).listenToOnce(this.configModel, "mip:model:reset", this.#onActionEnd).listenToOnce(this.configModel, "error", this.evaluateDirtyState());
      if (this.isTenantIdChanged && this.isConnectionChecked && command.get("name") === lang.commandMipSaveConfig && !_.isUndefined(this.configModel.getServerAttribute("applications_settings"))) {
        let checkExistingSelection = this.configModel.getServerAttribute("applications_settings")["search_allowed_labels"];
        if (!_.isUndefined(checkExistingSelection)) {
          this._confirmAction(lang.confirmTittle, lang.confirmMessage, "").done(function() {
            command.execute({
              context: self.options.context
            });
          });
        } else {
          command.execute({
            context: this.options.context
          });
        }
      } else {
        command.execute({
          context: this.options.context
        });
      }
    }
  }
  _confirmAction(title, message, okButtonLabel) {
    var dfd = $.Deferred(), buttonOptions = {
      showYes: true,
      labelYes: lang.labelButtonOk,
      showNo: false,
      showCancel: true
    };
    if (_.isString(okButtonLabel) && !_.isEmpty(okButtonLabel)) {
      buttonOptions["labelYes"] = okButtonLabel;
    }
    buttonOptions["labelCancel"] = lang.labelButtonCancel;
    Alert.confirmQuestion(function(result) {
      if (result) {
        dfd.resolve();
      } else {
        dfd.reject();
      }
    }, message, title, {
      buttons: buttonOptions
    });
    return dfd.promise();
  }
  #onActionStart() {
    this.#updateDisabledState(true);
  }
  #onActionEnd() {
    this.isDirty = false;
    this.evaluateDirtyState();
  }
  _onConfigModelRequest() {
    this.blockActions();
    this.clearDirtyState();
    this.listenToOnce(this.configModel, "sync error", () => {
      this.evaluateDirtyState();
      this.unblockActions();
    });
  }
  evaluateDirtyState() {
    const mipStatus = this.configModel.get("is_enabled"), mipServerStatus = this.configModel.getServerAttribute("is_enabled");
    if (mipStatus !== mipServerStatus || this.isDirty) {
      this.setDirtyState();
    } else {
      if (!this.isPartialDirty) {
        this.clearDirtyState();
      }
      this.isPartialDirty = false;
    }
  }
  setDirtyFlag(isDirty) {
    this.isDirty = isDirty;
    if (this.isDirty) {
      this.setDirtyState();
    } else {
      this.clearDirtyState();
    }
  }
  updateTenantAndConnectionCheckedFlag(options) {
    this.isTenantIdChanged = options.isTenantIdChanged;
    this.isConnectionChecked = options.isConnectionChecked;
  }
  setDirtyState() {
    this.#updateDisabledState(false);
    $(window).off(this.#unloadEventQualifier()).on(this.#unloadEventQualifier(), () => {
      return true;
    });
  }
  clearDirtyState() {
    $(window).off(this.#unloadEventQualifier());
    this.#updateDisabledState(true);
  }
  #unloadEventQualifier() {
    return `beforeunload.mip_config_${this.cid}`;
  }
  #updateDisabledState(state) {
    this.collection.each(model => {
      model.set("attr_disabled", state);
    });
  }
  setDisabledState(state, options) {
    this.collection.each(model => {
      if (model.get("attr_label") === options.attrLabel) {
        model.set("attr_disabled", state);
      }
    });
    this.isPartialDirty = options.isPartialDirty;
  }
}

Object.defineProperty(MipHeaderView.prototype.constructor, "name", {
  value: "MipHeaderView"
});

export default MipHeaderView;