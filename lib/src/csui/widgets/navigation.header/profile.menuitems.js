/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
        signature: "EditPerspective",
        name: lang.EditPerspective
      }, {
        signature: "PersonalizePage",
        name: lang.personalizePage
      }, {
        signature: "EditMultiplePerspectives",
        name: lang.editMultiplePerspectives
      }, {
        signature: "ManageBranding",
        name: lang.manageBranding
      }, {
        signature: "ContentServerAdministration",
        name: lang.ContentServerAdministrationMenuItemLabel
      }, {
        signature: "RecycleBin",
        name: lang.RecycleBin
      } ],
      view: [ {
        signature: "SwitchToTheme",
        groupBy: "switchto",
        group: "switchto",
        name: lang.switchToHeaderLabel,
        isLabel: true
      }, {
        signature: "SwitchToSmartview",
        groupBy: "switchto",
        group: "switchto",
        name: lang.switchToSmartViewMenuItemLabel,
        theme: "cf",
        sequence: 1
      }, {
        signature: "SwitchToJato",
        groupBy: "switchto",
        group: "switchto",
        name: lang.switchToJatoNewMenuItemLabel,
        theme: "jato",
        sequence: 1
      }, {
        signature: "SwitchToClassic",
        groupBy: "switchto",
        group: "switchto",
        name: lang.switchToClassicMenuItemLabel,
        sequence: 2
      } ],
      proxy: [],
      about: [ {
        signature: "AboutBox",
        name: lang.AboutBox
      } ],
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