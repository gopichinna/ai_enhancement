/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/sidebar.items", "csui-ext!csui/perspective.manage/sidebar/sidebar.items" ], function(_, SidebarItemCollection, extraItems) {
  "use strict";
  let sidebarItems = new SidebarItemCollection();
  if (extraItems) {
    sidebarItems.add(_.chain(extraItems).flatten(true).map(function(Item) {
      return new Item();
    }).sortBy(item => item.get("sequence")).value());
  }
  return sidebarItems;
});