/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

import OTWCElementView from "dctmw/controls/otwc/otwc.element.view";

class OTWCInputView extends OTWCElementView {
  tagName() {
    return "otc-input";
  }
  events() {
    return {
      change: e => {
        this._onInputChange(e);
      },
      input: _.throttle(function(e) {
        this._onInputChange(e);
      }.bind(this), 300, {
        trailing: true
      })
    };
  }
  triggers() {
    return {
      "action-icon-clicked": "action-icon-clicked",
      invalid: "invalid"
    };
  }
  constructor(options = {}) {
    options.model = options.model instanceof Model ? options.model : new Model({
      attr_type: "text"
    });
    super(options);
  }
  _onInputChange() {
    const oldValue = this.model.set("attr_value"), newValue = this.el.value;
    if (oldValue !== newValue) {
      this._selfValueChange = true;
      this.model.set("attr_value", newValue);
    }
  }
  shouldReRenderOnModelAttributeChange(changedAttributes) {
    const attrNames = Object.keys(changedAttributes);
    if (this._selfValueChange === true && attrNames.includes("attr_value") && attrNames.length === 1) {
      this._selfValueChange = false;
      return false;
    }
    return super.shouldReRenderOnModelAttributeChange(changedAttributes);
  }
}

Object.defineProperty(OTWCInputView.prototype.constructor, "name", {
  value: "OTWCInputView"
});

export default OTWCInputView;