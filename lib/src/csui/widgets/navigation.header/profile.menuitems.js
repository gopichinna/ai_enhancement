/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/widgets/navigation.header/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitem.model", "csui-ext!csui/widgets/navigation.header/profile.menuitems" ], function(_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  "use strict";
  var menuItems = {
    profileMenu: new ToolItemsFactory({
      profile: [ {
        signature: "UserProfile",
        name: lang.profileMenuItemLabel
      } ],
      others: [ {
        signature: "SwitchToClassic",
        name: lang.switchToClassicMenuItemLabel
      }, {
        signature: "EditPerspective",
        name: lang.EditPerspective
      }, {
        signature: "EditMultiplePerspectives",
        name: lang.editMultiplePerspectives
      }, {
        signature: "ContentServerAdministration",
        name: lang.ContentServerAdministrationMenuItemLabel
      }, {
        signature: "AboutBox",
        name: lang.AboutBox
      }, {
        signature: "RecycleBin",
        name: lang.RecycleBin
      } ],
      proxy: [],
      signout: [ {
        signature: "SignOut",
        name: lang.signOutMenuItemLabel
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_caret_down32"
    })
  };
  if (extraToolItems) {
    _.each(extraToolItems, function(moduleToolItems) {
      _.each(moduleToolItems, function(toolItems, key) {
        var targetToolbar = menuItems[key];
        if (!targetToolbar) {
          throw new Error("Invalid target toolbar: " + key);
        }
        _.each(toolItems, function(toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }
  return menuItems;
});