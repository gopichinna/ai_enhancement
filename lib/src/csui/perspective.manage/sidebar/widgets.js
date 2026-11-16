/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/sidebar.item", "csui/perspective.manage/sidebar/widget.panel.view", "i18n!csui/perspective.manage/sidebar/impl/nls/lang" ], function(SidebarItemModel, WidgetPanelView, Lang) {
  "use strict";
  let WidgetsModel = SidebarItemModel.extend({
    defaults: {
      signature: "Widgets",
      sequence: 2,
      name: Lang.widgets,
      iconClass: "csui-sidebar-widget-btn",
      panelTitle: Lang.widgets
    },
    getPanelView: function(options) {
      return new WidgetPanelView(options);
    }
  });
  return WidgetsModel;
});