/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/sidebar.item", "csui/perspective.manage/sidebar/widget.panel.view", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "i18n!csui/perspective.manage/sidebar/impl/nls/lang" ], function(SidebarItemModel, WidgetPanelView, theming, jatoActionIcons, Lang) {
  "use strict";
  let WidgetsModel = SidebarItemModel.extend({
    defaults: {
      signature: "Widgets",
      sequence: 2,
      name: Lang.widgets,
      iconClass: "csui-sidebar-widgets-btn",
      iconName: "csui_action:action_widgets32",
      iconSVG: jatoActionIcons.actionWidgetsAdd,
      panelTitle: Lang.widgets
    },
    getPanelView: function(options) {
      return new WidgetPanelView(options);
    }
  });
  return WidgetsModel;
});