/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "nuc/lib/underscore", "csui/lib/backbone", "csui/lib/jquery", "csui/utils/commands", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/controls/otc.menu/menu.items.view", "csui/widgets/permissions/dynamic.permissions/header.action.items", "csui/widgets/permissions/dynamic.permissions/header.action.items.masks", "csui/controls/toolbar/toolitems.filtered.model", "csui/utils/contexts/factories/connector", "hbs!csui/widgets/permissions/impl/dynamic.permissions/dynamic.permissions.header" ], function(Marionette, _, Backbone, $, commands, theming, jatoIcons, MenuItemsView, headerActions, HeaderActionItemsMasks, FilteredToolItemsCollection, ConnectorFactory, templateHeader) {
  "use strict";
  const DynamicPermissionsHeaderView = Marionette.ItemView.extend({
    tagName: "div",
    className: "csui-add-dynamic-permissions-content",
    template: templateHeader,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        iconName: "csui_action:action_add32",
        buttonID: _.uniqueId("dynamicPermissonAddRole"),
        hasEditDynamicPermission: this.options.hasEditDynamicPermission,
        iconSVG: jatoIcons.actionAdd
      };
    },
    ui: {
      addDynamicPermissionButton: ".csui-add-dynamic-permission",
      addDynamicPermissionMenu: ".csui-add-dynamic-permission-menu"
    },
    constructor: function DynamicPermissionsHeaderView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      this.createMenuItems();
    },
    createMenuItems: function() {
      const connector = this.options.context.getObject(ConnectorFactory);
      const status = {
        hasEditDynamicPermission: this.options.hasEditDynamicPermission,
        nodeModel: this.options.nodeModel,
        context: this.options.context,
        connector: connector,
        nodeId: this.options.nodeModel.get("id"),
        collection: this.options.collection
      };
      this.status = status;
      const headerActionItemsMasks = new HeaderActionItemsMasks();
      this.filteredToolItems = new FilteredToolItemsCollection(headerActions.dropdownMenuList, {
        status: status,
        commands: commands,
        mask: headerActionItemsMasks.toolbars.dropdownMenuList
      });
      const menuCollection = new Backbone.Collection(this.filteredToolItems.map(item => ({
        id: item.get("signature"),
        displayName: item.get("name")
      })));
      this.ui.addDynamicPermissionMenu.empty();
      const menuItemsView = new MenuItemsView({
        collection: menuCollection,
        childElm: "otc-menuitem"
      });
      menuItemsView.render();
      menuItemsView.children.each(childView => {
        this.ui.addDynamicPermissionMenu.append(childView.el);
      });
      const toolItems = this.ui.addDynamicPermissionMenu.find("otc-menuitem");
      toolItems.on("click", this.executeToolItemAction.bind(this));
      toolItems.on("keydown", this.onKeyInView.bind(this));
    },
    onKeyInView: function(event) {
      if (event.key === "Enter" || event.key === " ") {
        if (typeof event.target.click === "function") {
          event.preventDefault();
          event.target.click();
        }
      }
    },
    executeToolItemAction: function(event) {
      const deferred = $.Deferred();
      const self = this;
      const signature = event.target.getAttribute("id");
      const command = commands.findWhere({
        signature: signature
      });
      if (command) {
        command.execute(this.status).done(function(response) {
          Object.assign(response.attributes, response.get("role_id_expand"));
          self.collection.add(response);
          deferred.resolve(response);
        }, this).fail(function(err) {
          deferred.reject(err);
        });
      }
    }
  });
  return DynamicPermissionsHeaderView;
});