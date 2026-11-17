/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import OTWCInputView from "dctmw/controls/otwc/otwc.input.view";

import template from "hbs!dctmw/controls/signin.jato/impl/signin.input/template";

import "css!dctmw/controls/signin.jato/impl/signin.input/input";

import JatoActionIcons from "dctmw/utils/icons/dctmw.jato.action.icons";

class SigninInputView extends OTWCInputView {
  template = template;
  tagName() {
    return "div";
  }
  templateHelpers() {
    return {
      actionIcon: this.model.get("attr_type") === "password" ? JatoActionIcons.actionVisibility : null
    };
  }
  className() {
    return `signin-input-field base-input`;
  }
  ui() {
    return {
      inputField: "input",
      actionIcon: ".action-icon",
      actionBtn: ".action-btn"
    };
  }
  events() {
    return {
      "change @ui.inputField": e => {
        this._onInputChange(e);
      },
      "input @ui.inputField": _.throttle(function(e) {
        this._onInputChange(e);
      }.bind(this), 300, {
        trailing: true
      }),
      "pointerdown @ui.actionIcon": "showPassword"
    };
  }
  constructor(options = {}) {
    super(options);
    this.listenTo(this, "focus", () => {
      this.ui.inputField.trigger("focus");
    });
  }
  _onInputChange() {
    const oldVal = this.model.get("attr_value"), newVal = this.ui.inputField.val();
    if (oldVal !== newVal) {
      this._selfValueChange = true;
      this.model.set("attr_value", this.ui.inputField.val());
    }
    this.ui.actionBtn[newVal ? "show" : "hide"]();
  }
  onRender() {
    const attrs = this.buildAttrsMap();
    this.ui.inputField.attr(attrs);
    this.ui.actionBtn.hide();
    const propertyNamePrefix = this.getElementPropertyNamePrefixInModel();
    !this.hasChildElement() && this.$el.text(this.model.get(`${propertyNamePrefix}label`));
  }
  showPassword() {
    this.ui.inputField.attr("type", "text");
    this.ui.actionIcon.attr("svg", JatoActionIcons.actionVisibilityOff);
    document.addEventListener("pointermove", event => {
      this.hidePassword(event);
    }, {
      once: true
    });
    document.addEventListener("pointerup", event => {
      this.hidePassword(event);
    }, {
      once: true
    });
  }
  hidePassword(event) {
    event.preventDefault();
    this.ui.inputField.attr("type", "password");
    this.ui.actionIcon.attr("svg", JatoActionIcons.actionVisibility);
    this.ui.inputField.trigger("focus");
  }
}

Object.defineProperty(SigninInputView.prototype.constructor, "name", {
  value: "SigninInputView"
});

export default SigninInputView;