/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NamedLocalStorage from "nuc/utils/namedlocalstorage";

import {
  View
} from "nuc/lib/marionette3";

import template from "hbs!d2/widgets/task.aviator/impl/disclaimer/disclaimer";

import lang from "i18n!d2/widgets/task.aviator/nls/lang";

import publicLang from "i18n!csui/pages/start/nls/lang";

import "css!d2/widgets/task.aviator/impl/disclaimer/disclaimer";

import "smart/utils/otwc.loader";

const namedLocalStorage = new NamedLocalStorage("disclaimer_settings");

const unversionedProductName = publicLang.ProductName.replace(/\d+|\./g, " ").trim();

class DisclaimerView extends View {
  templateContext() {
    return {
      lang: lang
    };
  }
  focus(fromBottom) {
    const el = fromBottom && this.ui.reject[0] || this.ui.accept[0];
    if (el === document.activeElement) return false;
    el.focus();
    return true;
  }
  lastFocused() {
    return this.ui.reject[0] === document.activeElement;
  }
  static displayRequired() {
    const notAgain = namedLocalStorage.get("notAgain");
    return !(notAgain && notAgain.includes(unversionedProductName));
  }
}

function accept() {
  const {
    checked
  } = this.ui.notAgain[0];
  if (checked) {
    const notAgain = namedLocalStorage.get("notAgain") || [];
    if (!notAgain.includes(unversionedProductName)) {
      notAgain.push(unversionedProductName);
      namedLocalStorage.set("notAgain", notAgain);
    }
  }
  this.triggerMethod("accept");
}

Object.assign(DisclaimerView.prototype, {
  className: "aie-chat-disclaimer",
  template: template,
  ui: {
    notAgain: "otc-checkbox",
    accept: ".aie-accept",
    reject: ".aie-reject"
  },
  events: {
    "click @ui.accept": accept
  },
  triggers: {
    "click @ui.reject": "reject"
  }
});

Object.defineProperty(DisclaimerView.prototype.constructor, "name", {
  value: "DisclaimerView"
});

export default DisclaimerView;