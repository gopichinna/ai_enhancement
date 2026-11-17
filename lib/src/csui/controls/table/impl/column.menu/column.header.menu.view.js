/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/toolbar/toolbar.command.controller", "csui/controls/table/impl/column.menu/toolbaritems", "csui/controls/table/impl/column.menu/toolbaritems.masks", "csui/controls/table/impl/column.menu/commands", "csui/controls/table/impl/toolitem.menu/toolitem.menu.view" ], function(Marionette, FilteredToolItemsCollection, ToolbarCommandController, columnMenuToolbarItems, ColumnMenuToolbarItemsMasks, columnMenuCommands, ToolItemMenuView) {
  "use strict";
  const ColumnHeaderMenuView = Marionette.View.extend({
    className: "csui-column-header-menu",
    template: false,
    constructor: function ColumnHeaderMenuView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
      const commandController = new ToolbarCommandController({
        commands: columnMenuCommands
      });
      const toolItemFactory = columnMenuToolbarItems["tableColumnToolbar"];
      const columnMenuToolbarItemsMasks = new ColumnMenuToolbarItemsMasks();
      this._toolitemMenuView = new ToolItemMenuView({
        menuName: "tableColumn",
        dropDownButtonSize: "mini",
        dropDownText: this.options.dropDownText,
        dropDownAria: this.options.dropDownAria,
        columnName: this.options.columnName,
        resizeName: this.options.resizeName,
        ...toolItemFactory.options
      });
      this.listenTo(this._toolitemMenuView, "before:open", () => {
        if (!this._filteredCollection) {
          this._filteredCollection = new FilteredToolItemsCollection(toolItemFactory, {
            status: this.options.status,
            commands: commandController.commands,
            mask: columnMenuToolbarItemsMasks.toolbars["tableColumnToolbar"]
          });
          this._toolitemMenuView.options.collection = this._filteredCollection;
        } else {
          this._filteredCollection.refilter();
        }
      });
      this.listenTo(this._toolitemMenuView, "toolitem:action", toolItem => {
        commandController.toolitemClicked(toolItem, this.options.status);
      });
      this.commandController = commandController;
    },
    onDestroy() {
      this._toolitemMenuView.destroy();
    },
    onRender: function() {
      this.$el.append(this._toolitemMenuView.$el);
      this._toolitemMenuView.render();
    }
  });
  return ColumnHeaderMenuView;
});