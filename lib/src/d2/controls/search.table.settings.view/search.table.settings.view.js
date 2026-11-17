/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette3", "csui/utils/accessibility", "csui/controls/otc.menu/menu.items.view", "i18n!csui/controls/settings/impl/nls/lang", "hbs!csui/controls/settings/impl/settings", "css!csui/controls/settings/impl/settings" ], function($, _, Backbone, Marionette, Accessibility, MenuItemsView, lang, template) {
  "use strict";
  const accessibleTable = Accessibility.isAccessibleTable();
  return Marionette.View.extend({
    constructor: function SettingsView(options) {
      options || (options = {});
      _.defaults(options, {
        showDefaults: true
      });
      Marionette.View.call(this, options);
      this.enablePinnedColumns = this.options.searchResultsView.headerView.enablePinnedColumns && !accessibleTable;
    },
    template: template,
    templateContext: function() {
      var context = {
        showDefaults: this.options.showDefaults,
        iconName: "csui_action:action_settings32",
        btnId: this.options.btnId
      };
      return context;
    },
    regions: {
      searchSettingId: ".csui-search-setting-menu"
    },
    events: {
      "close otc-menu": "onCloseMenu"
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$("*[tabindex]");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]);
      }
    },
    onCloseMenu: function(event) {
      if (event.target.tagName.toLowerCase() === "otc-submenu") return;
      this.closeMenu();
    },
    onRender: function() {
      let selectedItem = this.options.tableCollection?.prevSearchDisplayStyle, optionsCollection = new Backbone.Collection(this.options.options);
      if (this.options.showDefaults && this.enablePinnedColumns) {
        optionsCollection.add([ {
          id: "tabularView",
          classname: "csui-tabular-view csui-search-view",
          displayName: lang.settingLabels.list,
          checked: selectedItem === "TabularView"
        }, {
          id: "allColumnsView",
          classname: "csui-all-columns-view csui-search-view",
          displayName: lang.settingLabels.pinnedColumns,
          checked: selectedItem === "AllColumnsView"
        } ]);
      }
      this.sortMenuSelectGroupView = new MenuItemsView({
        collection: optionsCollection,
        childElm: "otc-menuradio"
      });
      this.listenTo(this.sortMenuSelectGroupView, "change:selection", function({
        event,
        itemValue
      }) {
        this.onShowSettings(itemValue, event);
      });
      this.sortMenuSelectGroupView.render();
      this._regions.searchSettingId.show(this.sortMenuSelectGroupView);
    },
    closeMenu: function() {
      this.trigger("close:menu");
    },
    onShowSettings: function(view, event) {
      view.set("selected", true);
      this.options.searchResultsView.headerView.trigger("view:changed", event);
    }
  });
});