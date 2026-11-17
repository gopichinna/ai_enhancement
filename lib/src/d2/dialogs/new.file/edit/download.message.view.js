/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Marionette from "nuc/lib/marionette";

import template from "hbs!d2/dialogs/new.file/edit/impl/download.message";

import lang from "i18n!d2/dialogs/new.file/edit/impl/nls/lang";

import "css!d2/dialogs/new.file/edit/impl/download.message";

class DownloadMessageView extends Marionette.ItemView {
  template = template;
  events() {
    return {
      "change .form-checkbox": "_checkboxChange"
    };
  }
  className() {
    return "d2-download-message-container";
  }
  constructor(options = {}) {
    super(options);
    this.doNotShowCheckbox = false;
  }
  templateHelpers() {
    return {
      downloadInfoMessage: lang.DownloadInfoMessage,
      dontDownloadAgainLabel: lang.DontDownloadAgainMessage
    };
  }
  _checkboxChange(event) {
    this.doNotShowCheckbox = event && event.currentTarget && event.currentTarget.checked;
  }
}

Object.defineProperty(DownloadMessageView.prototype.constructor, "name", {
  value: "DownloadMessageView"
});

export default DownloadMessageView;