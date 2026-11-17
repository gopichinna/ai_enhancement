/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import OTWCInputView from "dctmw/controls/otwc/otwc.input.view";

import lang from "i18n!dctmw/controls/otwc/impl/nls/lang";

class OTWCInputSearchView extends OTWCInputView {
  constructor(options = {}) {
    options.model = options.model instanceof Model ? options.model : new Model({
      attr_type: "search"
    });
    const mustAttrs = {
      attr_type: "search"
    };
    if (!options.model.has("attr_placeholder")) {
      mustAttrs["attr_placeholder"] = lang.searchViewDefaultPlaceholder;
    }
    options.model.set(mustAttrs, {
      silent: true
    });
    super(options);
  }
  onRender() {
    super.onRender();
    this.$el.off("action-icon-clicked.self").on("action-icon-clicked.self", e => {
      this._onInputChange(e);
    });
  }
}

Object.defineProperty(OTWCInputSearchView.prototype.constructor, "name", {
  value: "OTWCInputSearchView"
});

export default OTWCInputSearchView;