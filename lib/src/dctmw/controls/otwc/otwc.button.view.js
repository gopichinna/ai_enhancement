/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import OTWCElementView from "dctmw/controls/otwc/otwc.element.view";

class OTWCButtonView extends OTWCElementView {
  tagName() {
    return "otc-button";
  }
  triggers() {
    return {
      click: "click"
    };
  }
  constructor(options = {}) {
    options.model = options.model instanceof Model ? options.model : new Model({
      attr_type: "secondary"
    });
    super(options);
  }
  onRender() {
    super.onRender();
    this.$el.addClass("dctm-binf-hidden");
    setTimeout(() => this.$el.removeClass("dctm-binf-hidden"));
  }
}

Object.defineProperty(OTWCButtonView.prototype.constructor, "name", {
  value: "OTWCButtonView"
});

export default OTWCButtonView;