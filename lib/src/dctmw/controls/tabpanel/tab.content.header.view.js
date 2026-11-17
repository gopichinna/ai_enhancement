/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  ItemView
} from "nuc/lib/marionette";

import template from "hbs!dctmw/controls/tabpanel/impl/tab.content.header";

class TabContentHeaderView extends ItemView {
  template = template;
  className() {
    return "d4-tab-content-header-c";
  }
  constructor(options = {}) {
    super(options);
  }
  templateHelpers() {
    return {
      title: this.model.get("headerTitle") || this.model.get("title")
    };
  }
}

Object.defineProperty(TabContentHeaderView.prototype.constructor, "name", {
  value: "TabContentHeaderView"
});

export default TabContentHeaderView;