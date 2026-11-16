/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model
} from "nuc/lib/backbone";

import {
  ItemView
} from "nuc/lib/marionette";

const ELEMENT_DEFAULT_PROP_MAP = {
  class_names: "class"
};

class OTWCElementView extends ItemView {
  template = false;
  attributes() {
    return {
      id: `otwc_${this.tagName()}_${this.cid}`
    };
  }
  constructor(options = {}) {
    options.model = options.model instanceof Model ? options.model : new Model({});
    super(options);
    this.listenTo(this.model, "change", () => {
      const changedAttributes = this.model.changedAttributes() || {};
      if (this.shouldReRenderOnModelAttributeChange(changedAttributes)) {
        this.render();
      }
    });
  }
  onRender() {
    const jsonAttrs = this.model.toJSON();
    const attrs = {};
    const propertyNamePrefix = this.getElementPropertyNamePrefixInModel();
    Object.keys(jsonAttrs).forEach(k => {
      if (k.startsWith(propertyNamePrefix)) {
        let kk = k.substring(propertyNamePrefix.length);
        if (this.isValidElementProperty(kk)) {
          kk = this.mapElementProperty(kk);
          attrs[kk] = jsonAttrs[k];
        }
      }
    });
    this.$el.attr(attrs);
    !this.hasChildElement() && this.$el.text(this.model.get(`${propertyNamePrefix}label`));
  }
  getElementPropertyNamePrefixInModel() {
    return "attr_";
  }
  isValidElementProperty(propName) {
    if (propName) {
      return ![ "id", "class", "style", "tabindex" ].includes(propName);
    }
    return false;
  }
  mapElementProperty(propName) {
    return ELEMENT_DEFAULT_PROP_MAP[propName] || propName;
  }
  hasChildElement() {
    return false;
  }
  getModel() {
    return this.model;
  }
  shouldReRenderOnModelAttributeChange() {
    return true;
  }
}

Object.defineProperty(OTWCElementView.prototype.constructor, "name", {
  value: "OTWCElementView"
});

export default OTWCElementView;