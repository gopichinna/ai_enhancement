/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import FormView from "d2/sdk/controls/form/form.view";

import formTemplate from "hbs!d2/dialogs/generic/impl/dialog.form.view";

import Session from "dctmw/utils/authenticators/session";

import "css!d2/dialogs/generic/impl/dialog.form.view";

class DialogFormView extends FormView {
  constructor(options = {}) {
    options.topAlignedLabel = true;
    options.mode = options.mode || "create";
    options.context = Session.get().getContext();
    super(options);
  }
  className() {
    let className = "d2-dialog-form-view csui-normal-scrolling csui-no-scroll-x";
    const clazz = _.isString(super.className) ? super.className : _.isFunction(super.className) ? super.className.call(this, this.options) : "";
    className += " " + clazz;
    if (this.options && this.options.className) {
      className += " " + _.result(this.options, "className");
    }
    return className;
  }
  validateForm(refreshState, validateOnlyRequiredFields) {
    return new Promise((res, rej) => {
      super.validateForm(refreshState, validateOnlyRequiredFields).done(res).fail(rej);
    });
  }
}

Object.assign(DialogFormView.prototype, {
  formTemplate: formTemplate
});

Object.defineProperty(DialogFormView.prototype.constructor, "name", {
  value: "DialogFormView"
});

export default DialogFormView;