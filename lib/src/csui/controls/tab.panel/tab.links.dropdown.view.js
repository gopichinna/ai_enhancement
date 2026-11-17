/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "hbs!csui/controls/tab.panel/impl/tab.links.dropdown", "csui/controls/otc.menu/menu.items.view", "i18n!csui/controls/tab.panel/impl/nls/lang", "csui/themes/csui.jato.action.icons", "smart/themes/theming", "css!csui/controls/tab.panel/impl/tab.links.dropdown" ], function(_, Backbone, Marionette, template, MenuItemsView, lang, JatoIcons, theming) {
  "use strict";
  const TabLinkDropDownView = Marionette.LayoutView.extend({
    className: "cs-tab-links binf-dropdown tile-nav",
    template: template,
    templateHelpers: function() {
      const title = this.selected?.get("title");
      return {
        single_item: this.collection.length <= 1,
        isJatoTheme: theming.isJATOTheme(),
        jatoChevronSmallDown: JatoIcons.actionChevronSmallDown,
        dropdownButtonTitle: lang.dropdownButtonTitle,
        dropdownButtonAria: _.str.sformat(lang.dropdownButtonAria, title),
        btnId: _.uniqueId("cstabBtn"),
        selectedTitle: title
      };
    },
    ui: {
      tabLinkBtn: ".csui-meta-data>otc-button",
      cbTabLinkBtn: ".csui-meta-data>button"
    },
    regions: {
      selectedMenuRegion: ".csui-meta-data>otc-menu"
    },
    constructor: function TabLinkDropDownView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.selected = new Backbone.Model();
      const activeTabIndex = this.options.activeTab?.get("tabIndex");
      if (this.collection?.length === 0 || activeTabIndex > this.collection.length) return;
      let selectedTabTitle = this.options.selectedTab && (this.options.selectedTab instanceof Backbone.Model && this.options.selectedTab?.get("title") || this.options.selectedTab);
      if (selectedTabTitle === this.collection.at(activeTabIndex).get("title")) {
        this._setSelection(this.collection.at(activeTabIndex));
      } else {
        let matchIndex = 0;
        if (selectedTabTitle !== undefined) {
          matchIndex = this._getModelIndexByPropertyValue(selectedTabTitle, this.collection, "title", "name");
        }
        this._setSelection(this.collection.at(matchIndex));
        this.options.activeTab.set("tabIndex", matchIndex);
      }
    },
    _getModelIndexByPropertyValue: function(value, collection, ...properties) {
      let indexToReturn = 0;
      const collectionLen = collection.length;
      for (let index = 0; index < collectionLen; index++) {
        const model = collection.at(index);
        if (model.get(properties[0]) === value || model.get(properties[1]) === value) {
          indexToReturn = index;
          break;
        }
      }
      return indexToReturn;
    },
    onRender: function() {
      if (this.collection.length <= 1) return;
      this.linkCollection = new Backbone.Collection();
      const selectedId = this.selected.get("id");
      for (let i = 0; i < this.collection.length; i++) {
        const model = this.collection.at(i);
        model.set("displayName", model.get("title"), {
          silent: true
        });
        model.set("checked", selectedId === model.get("id"), {
          silent: true
        });
        this.linkCollection.add(model);
      }
      this.sortMenuSelectGroupView = new MenuItemsView({
        collection: this.linkCollection,
        childElm: "otc-menuradio"
      });
      this.listenTo(this.sortMenuSelectGroupView, "change:selection", this._selectTabItem);
      this.selectedMenuRegion.show(this.sortMenuSelectGroupView);
    },
    currentlyFocusedElement: function() {
      return theming.isJATOTheme() ? this.ui.tabLinkBtn : this.ui.cbTabLinkBtn;
    },
    _selectTabItem: function({
      itemValue,
      isSilent = true
    }) {
      this._setSelection(itemValue);
      this.options.activeTab.set("tabIndex", this.collection.indexOf(itemValue), {
        silent: isSilent
      });
      this.render();
      const tabPane = this.options.tabPanel?.tabContent?.children.findByModel(itemValue);
      tabPane.ensureContent();
      this._activateTab(this.options.tabPanel?.tabContent.children._views, tabPane);
      const btnLink = theming.isJATOTheme() ? this.ui.tabLinkBtn : this.ui.cbTabLinkBtn;
      setTimeout(() => {
        btnLink.focus();
      }, 0);
    },
    _setSelection: function(model) {
      this.selected.set(model.pick("id", "title", "name"));
    },
    _activateTab: function(views = {}, selectedView) {
      const viewKeys = Object.keys(views);
      if (viewKeys.length === 0) return;
      for (let i = 0; i < viewKeys.length; i++) {
        const key = viewKeys[i];
        const view = views[key];
        if (view === selectedView) {
          view?.el?.classList.add("binf-in", "binf-active");
          this.selected.get("name") !== "properties" && view.trigger("dom:refresh");
        } else {
          view?.el?.classList.remove("binf-in", "binf-active");
        }
      }
    },
    activateDropdownTab: function(name, isSilent) {
      this.sortMenuSelectGroupView.children.some(view => {
        if (view.model.get("name") === name) {
          this._selectTabItem({
            itemValue: view.model,
            isSilent: isSilent
          });
          return true;
        }
      });
    }
  });
  return TabLinkDropDownView;
});