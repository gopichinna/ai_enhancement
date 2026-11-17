/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Alert from "smart/dialogs/modal.alert/modal.alert";

import SidePanelView from "smart/controls/side.panel/side.panel.view";

import BWSTabsPanelView from "d2/widgets/business.workspace/impl/bws.metadata.tabs.view";

import lang from "i18n!d2/commands/nls/localized.strings";

import Session from "dctmw/utils/authenticators/session";

class BWSMetadataPanel extends SidePanelView {
  className() {
    const baseClass = typeof super.className === "function" ? super.className() : "";
    return `d2-bws-metadata-panel ${baseClass}`;
  }
  constructor(options = {}) {
    const contentView = new BWSTabsPanelView({
      node: options.node,
      context: options.context,
      propertiesContent: options.formContent,
      suppressSpyScroll: true
    });
    super({
      title: options.workspaceInfoTitle || lang.workspaceInfoTitle,
      sidePanelClassName: "d2-bws-metadata-panel",
      layout: {
        size: "custom",
        header: true,
        footer: false
      },
      content: contentView,
      focus: false,
      rightButtons: [ {
        id: "save",
        label: lang.saveProperties,
        toolTip: lang.saveProperties,
        click: () => {
          console.log("Save clicked");
          this.hide();
        }
      } ],
      leftButtons: [ {
        id: "cancel",
        label: lang.cancel,
        toolTip: lang.cancel,
        click: () => {
          this.hide();
        }
      } ]
    });
    this.listenTo(this, "render", this.#onRender);
    this.listenTo(contentView, "some:event", args => this.trigger("some:event", args));
    this.listenTo(Session.get(), "end", this.hide);
    this.options.content = contentView;
  }
  handlePanelClose() {
    console.log("closeSidePanel");
    const isDirty = this.options.content?.isDirty?.();
    var buttonOptions = Alert.buttons.YesNo;
    buttonOptions["labelYes"] = lang.save;
    buttonOptions["labelNo"] = lang.cancel;
    if (isDirty) {
      Alert.confirmWarning(lang.unsavedChangesMessage, {
        buttons: buttonOptions
      }).done(() => {
        const propertiesView = this.options.content.getPropertiesView?.();
        if (propertiesView?._saveButtonClicked) {
          propertiesView._saveButtonClicked();
        }
      }).fail(() => {
        this.hide();
      });
    } else {
      this.hide();
    }
  }
  #onRender() {
    this.once("after:show", () => {
      if (this.options.content.focus) {
        this.options.content.focus();
      }
    });
  }
}

Object.defineProperty(BWSMetadataPanel.prototype.constructor, "name", {
  value: "BWSMetadataPanel"
});

export default BWSMetadataPanel;