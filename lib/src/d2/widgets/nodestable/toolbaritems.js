/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.factory", "csui/widgets/favorites/favorite.star.view", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function(module, _, ToolItemsFactory, FavoriteStarView, lang, commandLang) {
  "use strict";
  var config = _.extend({
    showFavoriteToolitem: true
  }, module.config());
  var rightToolbarItems = [ {
    signature: "D2-EmbedSearch",
    name: commandLang.CommandNameEmbeddedSearch,
    iconName: "csui_action_search32"
  }, {
    signature: "Aviator-LaunchChat",
    name: commandLang.CommandLaunchAviatorChat,
    iconName: "aie_action_aviator32"
  }, {
    signature: "D2-RefreshList",
    name: commandLang.CommandNameRefreshList,
    iconName: "csui_action_refresh32",
    enabled: true
  }, {
    signature: "Comment",
    name: lang.ToolbarItemComment,
    icon: "icon icon-socialComment",
    svgId: "themes--carbonfiber--image--generated_icons--action_no_comment32",
    svgIdForOn: "themes--carbonfiber--image--generated_icons--action_comment32",
    className: "esoc-socialactions-comment",
    customView: true,
    commandData: {
      useContainer: true
    }
  } ];
  if (config.showFavoriteToolitem !== false) {
    rightToolbarItems.push({
      signature: "D2-Favorite",
      viewClass: FavoriteStarView,
      customView: true,
      commandData: {
        useContainer: true,
        viewOptions: {
          focusable: false
        }
      }
    });
  }
  rightToolbarItems.push({
    signature: "D2-TableSettings",
    name: commandLang.CommandNameTableSettings,
    iconName: "d2_action_settings",
    manageVersions: false,
    manageMarkupStatus: true,
    manageWorkflowStatus: true,
    allowTableModeChange: true
  });
  return {
    filterToolbar: new ToolItemsFactory({
      filter: [ {
        signature: "D2-NodeTree",
        name: commandLang.CommandNameNodeTree,
        iconName: "d2_action_toggle_tree"
      }, {
        signature: "Filter",
        name: lang.ToolbarItemFilter,
        iconName: "d2_action_filter_active",
        toolItemAria: lang.ToolbarItemFilterAria,
        toolItemAriaExpand: false
      } ]
    }, {
      maxItemsShown: 2,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    addToolbar: new ToolItemsFactory(),
    leftToolbar: new ToolItemsFactory({
      main: [ {
        signature: "Back",
        name: commandLang.CommandNameBack,
        iconName: "csui_action_back32"
      } ]
    }, {
      maxItemsShown: 2,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    tableHeaderToolbar: new ToolItemsFactory(),
    captionMenuToolbar: new ToolItemsFactory({
      other: []
    }, {
      maxItemsShown: 0,
      dropDownIcon: "icon icon-expandArrowDown",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
    }),
    inlineActionbar: new ToolItemsFactory(),
    configurationToolbar: new ToolItemsFactory({
      main: []
    }, {
      addTrailingDivider: false
    }),
    rightToolbar: new ToolItemsFactory({
      main: rightToolbarItems
    }, {
      hAlign: "right",
      maxItemsShown: 5,
      dropDownIcon: "icon icon-toolbar-more",
      dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
      dropDownText: lang.ToolbarItemMore,
      addTrailingDivider: false
    }),
    clone: function() {
      return ToolItemsFactory.cloneToolbarItems(this);
    }
  };
});