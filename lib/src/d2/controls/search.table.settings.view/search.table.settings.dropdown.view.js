/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette3", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!d2/controls/search.table.settings.view/search.table.settings.dropdown" ], function($, Marionette, TabableRegionBehavior, template) {
  "use strict";
  var SettingsDropDownOptionView = Marionette.View.extend({
    tagName: "li",
    template: template,
    className: "binf-list-group-item",
    templateContext: function() {
      return {
        checked: !!this.model.get("selected")
      };
    },
    triggers: {
      "click a": {
        event: "show:settings"
      },
      "keydown a": {
        event: "show:settings:dropdown",
        preventDefault: false
      }
    },
    constructor: function SettingsDropDownOptionView(options) {
      options || (options = {});
      this.options = options;
      if ((options.settingsView.options.tableCollection?.prevSearchDisplayStyle)?.toLowerCase() === options.model.get("id").toLowerCase()) {
        options.model.set("selected", true);
      }
      Marionette.View.call(this, options);
    }
  });
  return Marionette.CollectionView.extend({
    constructor: function SettingsDropDownView() {
      this.focusIndex = 0;
      Marionette.CollectionView.apply(this, arguments);
    },
    className: "binf-list-group",
    tagName: "ul",
    attributes: {
      role: "menu",
      id: "search-setting-wrapper",
      "aria-label": "search settings"
    },
    childView: SettingsDropDownOptionView,
    childViewEvents: {
      "show:settings:dropdown": "onShowSettingsDropdown",
      "show:settings": "onShowSettings"
    },
    childViewOptions: function() {
      return {
        settingsView: this.options.settingsView
      };
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
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
    onShowSettings: function(view, event) {
      if (event.currentTarget.id === "tabularView" || event.currentTarget.id === "allColumnsView") {
        const settingsEle = this.el.closest(".csui-search-settings").querySelector(".csui-setting-icon");
        this.collection.findWhere({
          selected: true
        }).unset("selected");
        view.model.set("selected", true);
        this.options.settingsView.triggerMethod("close:menu", event);
        this.options.searchResultsView.headerView.trigger("view:changed", event);
        settingsEle.focus();
        settingsEle.setAttribute("tabindex", 0);
      }
    },
    onShowSettingsDropdown: function(view, event) {
      var keyCode = event.keyCode, focusables = this.$el.find("a[tabindex]"), loaderDisabled = !!this.options.searchResultsView.$el.find(".load-container.binf-hidden").length;
      if (!loaderDisabled) {
        event.stopPropagation();
        event.preventDefault();
      } else if (keyCode === 13 || keyCode === 32 || keyCode === 39) {
        this.onShowSettings(view, event);
        event.preventDefault();
        event.stopPropagation();
      } else if (focusables.length) {
        if (keyCode === 38 || keyCode === 40) {
          if (keyCode === 38) {
            this.focusIndex > 0 && --this.focusIndex;
          } else {
            this.focusIndex < focusables.length - 1 && ++this.focusIndex;
          }
          $(focusables[this.focusIndex]).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        }
      }
    }
  });
});