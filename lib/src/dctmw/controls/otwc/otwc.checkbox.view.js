/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import OTWCElementView from "dctmw/controls/otwc/otwc.element.view";

class OTWCCheckboxView extends OTWCElementView {
  tagName() {
    return "otc-checkbox";
  }
  events() {
    return {
      change: "_onStateChange"
    };
  }
  constructor(options = {}) {
    options.model = options.model instanceof Model ? options.model : new Model({
      attr_checked: false
    });
    super(options);
  }
  _onStateChange(e) {
    e && e.stopPropagation();
    this.model.set("attr_checked", !this.model.get("attr_checked"));
  }
}

Object.defineProperty(OTWCCheckboxView.prototype.constructor, "name", {
  value: "OTWCCheckboxView"
});

export default OTWCCheckboxView;