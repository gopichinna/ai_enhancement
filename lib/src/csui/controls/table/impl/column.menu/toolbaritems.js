/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/table/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/controls/table/impl/column.menu/state.toolitem.view", "i18n", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, lang, ToolItemsFactory, StateToolItemView, i18n) {
  "use strict";
  var toolbarItems = {
    tableColumnToolbar: new ToolItemsFactory({
      sort: [ {
        signature: "TableColumnSortAscending",
        name: lang.TableColumnMenuSortAscending,
        iconNameForOn: "csui_smart_utility_checkmark16",
        icon: "icon",
        dropdown: {
          renderIconAndText: true
        },
        customView: true,
        commandData: {
          customView: StateToolItemView
        }
      }, {
        signature: "TableColumnSortDescending",
        name: lang.TableColumnMenuSortDescending,
        iconNameForOn: "csui_smart_utility_checkmark16",
        icon: "icon",
        dropdown: {
          renderIconAndText: true
        },
        customView: true,
        commandData: {
          customView: StateToolItemView
        }
      } ],
      resize: [ {
        signature: "TableColumnResizeMinWidth",
        name: lang.TableColumnMenuResizeMinWidth
      }, {
        signature: "TableColumnResizeFitToContent",
        name: lang.TableColumnMenuFitToContent
      } ]
    }, {
      maxItemsShown: 0,
      dropDownIconName: "csui_action_more32"
    })
  };
  toolbarItems.clone = function() {
    return ToolItemsFactory.cloneToolbarItems(this);
  };
  return toolbarItems;
});