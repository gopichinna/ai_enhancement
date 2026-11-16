/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/sidebar.item", "csui/perspective.manage/sidebar/layouts.panel.view", "csui/perspective.manage/impl/perspectivelayouts", "i18n!csui/perspective.manage/sidebar/impl/nls/lang" ], function(SidebarItemModel, LayoutsPanelView, perspectiveLayouts, Lang) {
  "use strict";
  let LayoutsModel = SidebarItemModel.extend({
    defaults: {
      signature: "Layouts",
      sequence: 1,
      name: Lang.layouts,
      iconClass: "csui-sidebar-layouts-btn",
      panelTitle: Lang.layouts
    },
    getPanelView: function(options) {
      let args = options?.data ? options : {
        data: {
          items: perspectiveLayouts
        }
      };
      args.draggable = !!args.data.draggable;
      args.itemClassName = "csui-layout-item";
      args.context = options.context;
      args.perspectiveType = options.perspectiveType;
      return new LayoutsPanelView(args);
    }
  });
  return LayoutsModel;
});