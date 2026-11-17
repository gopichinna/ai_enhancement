/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Session from "dctmw/utils/authenticators/session";

import utils from "dctmw/utils/utils";

import constants from "d2/utils/constants";

class OpenWindowPopup {
  static #sessionStoreKey = "popupNames";
  static #initialized = false;
  static #namedSessionStorage = null;
  static initialize() {
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;
    var context = Session.get().getContext();
    var connector = context && context.getObject("connector");
    connector.authenticator.on("loggedOut", function() {
      this.#closeAllPopups();
    }.bind(this));
    this.#namedSessionStorage = utils.getSessionStore(constants.StorageKey.WINDOW_POPUP);
    var storageExists = this.#namedSessionStorage.get(this.#sessionStoreKey);
    if (!storageExists) {
      this.#namedSessionStorage.set(this.#sessionStoreKey, {});
    }
  }
  static showWindow(url, popupName, htmlContent, height, width, top, left) {
    const msPopupWindow = window.open(url, popupName, "popup=true" + ",height=" + height + ",width=" + width + ",top=" + top + ",left=" + left + ",menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes");
    if (!msPopupWindow) {
      return false;
    }
    this.#addToSessionStorage(popupName, url);
    this.#checkWindowForClose(msPopupWindow);
    !msPopupWindow.document.body?.hasChildNodes() && msPopupWindow.document.write(htmlContent);
    return msPopupWindow;
  }
  static #checkWindowForClose(msPopupWindow) {
    var windowChecker = function(name) {
      if (!msPopupWindow || msPopupWindow.closed) {
        this.#removeFromSessionStorage(name);
      } else {
        setTimeout(windowChecker.bind(this, name), 250);
      }
    };
    setTimeout(windowChecker.bind(this, msPopupWindow.name), 250);
  }
  static #closeAllPopups() {
    var openPopupWindowList = this.#namedSessionStorage.get(this.#sessionStoreKey);
    _.each(openPopupWindowList, (url, popupName) => {
      let popup = window.open(url, popupName, "popup=true");
      this.#removeFromSessionStorage(popupName);
      popup.close();
    });
  }
  static #addToSessionStorage(popupName, url) {
    var popupObject = this.#namedSessionStorage.get(this.#sessionStoreKey);
    popupObject[popupName] = url;
    this.#namedSessionStorage.set(this.#sessionStoreKey, popupObject);
  }
  static #removeFromSessionStorage(popupName) {
    var popupObject = this.#namedSessionStorage.get(this.#sessionStoreKey);
    delete popupObject[popupName];
    this.#namedSessionStorage.set(this.#sessionStoreKey, popupObject);
  }
}

Object.defineProperty(OpenWindowPopup.prototype.constructor, "name", {
  value: "OpenWindowPopup"
});

export default OpenWindowPopup;