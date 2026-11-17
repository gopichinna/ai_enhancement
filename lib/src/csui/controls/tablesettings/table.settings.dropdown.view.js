/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/utils/otwc.loader", "i18n!csui/controls/tablesettings/impl/nls/lang", "csui/controls/toolbar/toolitems.filtered.model", "csui/utils/commands", "csui/controls/tablesettings/menu.item.views/table.settings.menu.item.view", "csui/controls/tablesettings/menu.item.views/table.settings.menu.group.view", "csui/controls/tablesettings/menu.item.views/table.settings.menu.checkbox.view", "csui/controls/tablesettings/menu.item.views/table.settings.menu.divider.view", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "hbs!csui/controls/tablesettings/impl/table.settings.dropdown", "css!csui/controls/tablesettings/impl/table.settings.dropdown", "csui/themes/carbonfiber/ot-icons/icons_csui_action" ], function(_, Backbone, Marionette, log, otwcLoader, lang, FilteredToolItemsCollection, commands, TableSettingsMenuItemView, TableSettingsMenuGroupView, TableSettingsMenuCheckboxView, TableSettingsMenuDividerView, theming, JatoIcons, template) {
  "use strict";
  const TableSettingsDropdownView = Marionette.CompositeView.extend({
    className: "csui-table-settings-dropdown-view",
    template: template,
    childViewContainer: "otc-menu",
    constructor: function TableSettingsDropdownView(options) {
      if (!options) {
        throw new Error("options object is mandatory for TableSettingsDropdownView");
      }
      if (!options.originatingView) {
        throw new Error("options.originatingView is mandatory for TableSettingsDropdownView");
      }
      _.defaults(options, {
        iconName: "csui_action:action_settings32",
        toolbarButtonId: _.uniqueId()
      });
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.iconName = options.iconName;
      this.toolbarButtonId = options.toolbarButtonId;
      this.useIconsForDarkBackground = options.useIconsForDarkBackground;
      if (typeof options.originatingView.getTableMode === "function" && typeof options.originatingView.setTableMode === "function") {
        this.nodesTableView = options.originatingView;
        const tableSettingsToolItemsFactory = this.nodesTableView.options.toolbarItems.tableSettingsToolbar;
        this.status = {
          collection: this.nodesTableView.collection instanceof Backbone.Collection ? this.nodesTableView.collection : undefined,
          container: this.nodesTableView.container,
          context: options.context,
          currentTableMode: this.nodesTableView.getTableMode(),
          showDescription: this.nodesTableView.getDescriptionShown(),
          canCustomizeColumns: typeof this.nodesTableView.openColumnSettings === "function"
        };
        this.collection = new Backbone.Collection();
        this.filteredToolItemsCollection = new FilteredToolItemsCollection(tableSettingsToolItemsFactory, {
          status: this.status,
          commands: commands,
          mask: options.toolItemsMask
        });
        this.listenTo(this.status.collection, "reset", () => {
          this.filteredToolItemsCollection.refilter();
        });
      } else {
        log.error("options.originatingView is not an instance of NodesTableView => dropdown will be empty") && console.error(log.last);
        this.filteredToolItemsCollection = new FilteredToolItemsCollection([]);
      }
      this._setViewCollection();
      this.listenTo(this.filteredToolItemsCollection, "reset", () => {
        this._setViewCollection();
      });
    },
    templateHelpers: function() {
      const data = {
        iconName: this.iconName,
        iconAppearance: this.useIconsForDarkBackground ? "light" : "dark",
        iconSVG: JatoIcons.actionSettings,
        isJATO: theming.isJATOTheme(),
        toolbarButtonLabel: lang.tableSettingsToolbarLabel,
        toolbarButtonId: this.toolbarButtonId
      };
      return data;
    },
    getChildView: function(item) {
      if (item.get("signature") === "-") {
        return TableSettingsMenuDividerView;
      } else {
        switch (item.get("itemType")) {
         case "menuitem":
          return TableSettingsMenuItemView;

         case "menugroup":
          return TableSettingsMenuGroupView;

         case "menucheckbox":
          return TableSettingsMenuCheckboxView;
        }
      }
    },
    ui: {
      dropdown: "otc-menu.csui-table-settings-dropdown"
    },
    childEvents: {
      "change:selection": "performOptionChange",
      "change:switch": "performSwitchChange",
      "selected:menuitem": "performOptionSelected"
    },
    performOptionChange: async function(itemView, eventData) {
      this.closeMenu();
      const selectionView = eventData.selectionView;
      await this.executeCommandForEvent(selectionView, eventData);
      this._setViewCollection();
    },
    performSwitchChange: async function(itemView, eventData) {
      this.closeMenu();
      await this.executeCommandForEvent(itemView, eventData);
      this._setViewCollection();
    },
    performOptionSelected: async function(itemView, eventData) {
      this.closeMenu();
      await this.executeCommandForEvent(itemView, eventData);
    },
    closeMenu: function() {
      if (this.isRendered) {
        this.ui.dropdown[0].removeAttribute("isopen");
      }
    },
    executeCommandForEvent: async function(itemView, eventData) {
      const signature = itemView.model.get("signature");
      const command = commands.get(signature);
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        } else if (_.isFunction(command.execute)) {
          const status = this.status;
          const options = _.extend({
            nodesTableView: this.nodesTableView
          }, eventData);
          await command.execute(status, options);
        }
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
      }
    },
    _setViewCollection: function() {
      const toolItems = [];
      let radioItems = [];
      function finishMenuGroup() {
        if (radioItems.length > 1) {
          const radioGroupToolItem = new Backbone.Model({
            itemType: "menugroup",
            itemValue: radioItems,
            groupTitle: radioItems.at(0).get("groupTitle")
          });
          toolItems.push(radioGroupToolItem);
          radioItems = [];
        }
      }
      this.status.currentTableMode = this.nodesTableView.getTableMode();
      this.status.showDescription = this.nodesTableView.getDescriptionShown();
      this.filteredToolItemsCollection.refilter();
      this.filteredToolItemsCollection.each(toolItem => {
        const itemType = toolItem.get("itemType");
        const statusAttributeForChecked = toolItem.get("commandData")?.statusAttributeForChecked;
        switch (itemType) {
         case "menuradio":
          if (statusAttributeForChecked) {
            const statusValue = this.status[statusAttributeForChecked];
            const itemValue = toolItem.get("itemValue");
            let checked;
            if (itemValue === undefined) {
              checked = statusValue;
            } else {
              checked = itemValue === statusValue;
            }
            toolItem.set("checked", checked);
          }
          radioItems.push(toolItem);
          break;

         case "menucheckbox":
          finishMenuGroup();
          if (statusAttributeForChecked) {
            const statusValue = this.status[statusAttributeForChecked];
            const itemValue = toolItem.get("itemValue");
            let checked;
            if (itemValue === undefined) {
              checked = statusValue;
            } else {
              checked = itemValue === statusValue;
            }
            toolItem.set("checked", checked);
            toolItems.push(toolItem);
          }
          break;

         default:
          finishMenuGroup();
          if (toolItem.get("signature") === "-") {
            if (toolItems.length === 0) {
              return;
            }
          }
          toolItems.push(toolItem);
        }
      });
      finishMenuGroup();
      this.collection.reset(toolItems);
    }
  });
  return TableSettingsDropdownView;
});