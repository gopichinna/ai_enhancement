/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import TabLinksExtScrollMixin from "smart/controls/tab.panel/tab.links.ext.scroll.mixin";

TabLinksExtScrollMixin._findTabIndexByID = function(tabID) {
  var formModel = null;
  var tabs = this.tablinksToolbar && this.tablinksToolbar.find(this.tabsSelector);
  let filteredItems = this.collection.filter(model => !(model.get("hidden") || model.get("options")?.hideTab));
  if (tabs) {
    var i;
    for (i = 0; i < tabs.length; i++) {
      var href = $(tabs[i]).find(">a").attr("href");
      let domTitle = $(tabs[i]).find(">a").attr("title");
      let title = filteredItems[i]?.attributes?.title;
      href[0] === "#" && (href = href.substr(1));
      if (tabID === href && domTitle === title) {
        formModel = filteredItems[i];
        break;
      }
    }
  }
  return this.collection.indexOf(formModel);
};