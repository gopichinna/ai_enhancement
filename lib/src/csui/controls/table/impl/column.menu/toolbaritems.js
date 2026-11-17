/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/controls/table/impl/nls/lang", "csui/controls/toolbar/toolitems.factory", "csui/themes/csui.jato.action.icons", "i18n", "csui/themes/carbonfiber/action_icons" ], function(_, lang, ToolItemsFactory, jatoIcons) {
  "use strict";
  var toolbarItems = {
    tableColumnToolbar: new ToolItemsFactory({
      sort: [ {
        signature: "TableColumnSortAscending",
        name: lang.TableColumnMenuSortAscending
      }, {
        signature: "TableColumnSortDescending",
        name: lang.TableColumnMenuSortDescending
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
      dropDownIconSVG: jatoIcons.actionChevronSmallDown,
      dropDownIconName: "csui_action_more16"
    })
  };
  toolbarItems.clone = function() {
    return ToolItemsFactory.cloneToolbarItems(this);
  };
  return toolbarItems;
});