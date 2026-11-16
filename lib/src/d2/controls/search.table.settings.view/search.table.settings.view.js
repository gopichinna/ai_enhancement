/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette3", "csui/utils/accessibility", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/controls/search.table.settings.view/search.table.settings.dropdown.view", "i18n!csui/controls/settings/impl/nls/lang", "hbs!csui/controls/settings/impl/settings", "css!csui/controls/settings/impl/settings" ], function($, _, Backbone, Marionette, Accessibility, TabableRegionBehavior, SettingsDropDownView, lang, template) {
  "use strict";
  return Marionette.View.extend({
    constructor: function SettingsView(options) {
      options || (options = {});
      _.defaults(options, {
        showDefaults: true
      });
      Marionette.View.call(this, options);
    },
    className: "csui-settings-container",
    template: template,
    templateContext: function() {
      var context = {
        showDefaults: this.options.showDefaults
      };
      return context;
    },
    regions: function() {
      var regions = {
        settingsDropDownContainer: this.options.settingsDropDownContainer || ".settings-dropdown-container"
      };
      if (this.options.showDefaults) {
        _.extend(regions, {
          tabularView: ".csui-tabular-search-view",
          allColumnsView: ".csui-all-columns-search-view"
        });
      }
      return regions;
    },
    ui: function() {
      var ui = {
        settingsDropDownContainer: ".settings-dropdown-container"
      };
      if (this.options.showDefaults) {
        _.extend(ui, {
          tabularView: ".csui-tabular-search-view",
          allColumnsView: ".csui-all-columns-search-view"
        });
      }
      return ui;
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
    onRender: function() {
      var optionsCollection = new Backbone.Collection(this.options.options);
      if (this.options.showDefaults) {
        optionsCollection.add([ {
          id: "tabularView",
          classname: "csui-tabular-view csui-search-view",
          label: lang.settingLabels.list
        }, {
          id: "allColumnsView",
          classname: "csui-all-columns-view csui-search-view",
          label: lang.settingLabels.pinnedColumns
        } ]);
      }
      this.settingsDropDownView = new SettingsDropDownView({
        settingsView: this,
        model: this.model,
        tableCollection: this.options.tableCollection,
        collection: optionsCollection,
        searchResultsView: this.options.searchResultsView
      });
      this.showChildView("settingsDropDownContainer", this.settingsDropDownView);
      this.currentCard = this.ui.settingsDropDownContainer;
    },
    onShow: function() {
      this.$el.css("height", this.currentCard.outerHeight());
    }
  });
});