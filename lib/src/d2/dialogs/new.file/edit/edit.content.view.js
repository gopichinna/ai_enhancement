/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import BaseContentView from "d2/dialogs/new.file/edit/base.content.view";

import ReserveCommand from "d2/commands/reserve";

import DownloadMessageView from "d2/dialogs/new.file/edit/download.message.view";

import ModalAlert from "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import utils from "dctmw/utils/utils";

import constants from "d2/utils/constants";

import ctfBridge from "d2/ctf/ctfBridge";

import lang from "i18n!d2/dialogs/new.file/edit/impl/nls/lang";

import commandLang from "i18n!d2/commands/nls/localized.strings";

const LOCAL_STORAGE_NAME = "editAndDownloadPreference";

let localPrefStore;

const PREFERENCE_KEY = "NoEditAndDownload";

class EditContentView extends BaseContentView {
  constructor(options = {}) {
    super(options);
    this.fetchDataForContentEdit();
  }
  fetchDataForContentEdit() {
    const url = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.CHECKOUT_PRECHECK);
    const me = this;
    const commitPendingObjects = () => me.options.action.commitFile(me.options.node, me.options.wizard);
    const reserveFile = () => {
      me.options.node.contentCreatedBeforeEdit = true;
      $.ajax(me.options.node.connector.extendAjaxOptions({
        url: url,
        success: response => {
          switch (response.status) {
           case "WARNING":
            me.prependMessage("warning", response.message);
            break;

           case "ERROR":
            me.prependMessage("error", response.message);
            me.disableEditButton();
            break;

           default:
            me.prependMessage();
            break;
          }
          me.options.wizard.unblockActions();
        },
        error: (xhr, textStatus, errorThrown) => {
          me.prependMessage("error", utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown));
          me.disableEditButton();
          me.options.wizard.unblockActions();
        }
      }));
    };
    me.options.wizard.blockActions();
    let msg = commandLang.CreateItemSuccessMessageFormat;
    if (me.options.action.isLinkedDoc === true) {
      msg = commandLang.CreateAndLinkItemSuccessMessageFormat;
      me.renderMessage("success", _.str.sformat(msg, me.options.node.get("name")), lang.CreationInformationalMessage);
      reserveFile();
    } else {
      commitPendingObjects().always(() => {
        const linkedNodes = me.options.action._getLinkedNodes(me.options.node, me.options.wizard);
        if (linkedNodes && linkedNodes.length > 0) {
          msg = commandLang.CreateItemSuccessMessageFormatWithLink;
        }
        me.renderMessage("success", _.str.sformat(msg, me.options.node.get("name")), lang.CreationInformationalMessage);
        reserveFile();
      });
    }
  }
  disableEditButton() {
    this.isEditButtonDisabled = true;
    this.options.wizard.refreshFooter();
  }
  onClickEditNow() {
    const node = this.options.node;
    this.getInitialDataForCheckout(node).done(() => {
      this.options.wizard.blockActions();
      this.checkoutNode(node).done(response => this.handleSuccessfulCheckout(node, response)).fail(() => this.handleCheckoutError(node));
    });
  }
  checkoutNode(node) {
    const checkoutUrl = RestLinkrels.getLink(node.get("links"), RestLinkrels.CHECKOUT);
    return $.ajax(node.connector.extendAjaxOptions({
      type: "PUT",
      url: checkoutUrl
    }));
  }
  handleSuccessfulCheckout(node, response) {
    node.set("links", node.get("links").concat(response.links));
    const dlHelper = this.options.downloadHelper;
    const downloadLink = dlHelper.getDownloadLink(node);
    if (!downloadLink) {
      this.contentLessObject = true;
    }
    this.options.wizard.unblockActions();
    if (!ctfBridge.isCtfEnabled() && downloadLink) {
      this.showDownloadInfoDialog(node);
    } else {
      this.options.wizard.nextStep();
    }
  }
  showDownloadInfoDialog(node) {
    const me = this;
    const downloadMessageView = new DownloadMessageView();
    const buttonOptions = {
      showYes: true,
      labelYes: lang.DownloadButtonLabel,
      showNo: false,
      showCancel: true,
      labelCancel: lang.CancelButtonLabel
    };
    const dlHelper = me.options.downloadHelper;
    const downloadLink = dlHelper.getDownloadLink(node);
    const storePreferenceValue = me.getStorePreference(PREFERENCE_KEY);
    if (!storePreferenceValue || storePreferenceValue !== true) {
      ModalAlert.confirmInformation(result => {
        if (result) {
          if (downloadMessageView && downloadMessageView.doNotShowCheckbox) {
            me.saveStorePreference(me.getLocalPrefStore(), PREFERENCE_KEY, true);
          }
          if (downloadLink) {
            dlHelper._downloadContent(node);
          }
          me.options.wizard.unblockActions();
          me.options.wizard.nextStep();
        } else {
          me.options.wizard.unblockActions();
        }
      }, "", lang.DownloadDialogHeaderTitle, {
        buttons: buttonOptions,
        contentView: downloadMessageView,
        className: "d2-download-message-alert"
      });
    } else {
      if (downloadLink) {
        dlHelper._downloadContent(node);
      }
      me.options.wizard.unblockActions();
      me.options.wizard.nextStep();
    }
  }
  handleCheckoutError(node) {
    this.prependMessage("error", _.str.sformat(lang.CheckoutFailed, node.get("name")));
    this.disableEditButton();
    this.options.wizard.unblockActions();
  }
  getLocalPrefStore() {
    const storeName = `${LOCAL_STORAGE_NAME}:${RestResources.getCurrentUser().get("name")}`;
    if (!localPrefStore || localPrefStore.name !== storeName) {
      localPrefStore = utils.getLocalStore(storeName);
    }
    return localPrefStore;
  }
  saveStorePreference(store, preferenceKey, preferenceValue) {
    return store.set(preferenceKey, preferenceValue);
  }
  getStorePreference(preferenceKey) {
    return this.getLocalPrefStore().get(preferenceKey);
  }
  getEditButtonLabel() {
    return lang.EditButtonLabel;
  }
  getInitialDataForCheckout(node) {
    const deferred = $.Deferred();
    if (ctfBridge.isCtfEnabled()) {
      const reserveCommand = new ReserveCommand();
      reserveCommand._validateCtfPath({
        connector: node.connector
      }).done(() => {
        const pref = RestResources.getCurrentUser().get("preferences");
        const checkoutPath = pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
        if (checkoutPath) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }).fail(deferred.reject);
    } else {
      deferred.resolve();
    }
    return deferred.promise();
  }
  getNextStep() {
    let nextStep = this.options.action.STEPS.ADD_VERSION;
    if (ctfBridge.isCtfEnabled() && !this.contentLessObject) {
      nextStep = this.options.action.STEPS.DOWNLOADING_CONTENT;
    }
    return nextStep;
  }
  getTitle() {
    return this.options.action.isLinkedDoc === true ? lang.EditLinkedDocumentContentTitle : lang.EditContentTitle;
  }
}

Object.defineProperty(EditContentView.prototype.constructor, "name", {
  value: "EditContentView"
});

export default EditContentView;