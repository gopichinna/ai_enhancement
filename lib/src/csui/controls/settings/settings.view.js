/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette3", "csui/utils/accessibility", "i18n", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/settings/impl/settings.dropdown.view", "csui/controls/settings/selected.columns/selected.columns.view", "csui/controls/settings/summary.description/summary.description.view", "i18n!csui/controls/settings/impl/nls/lang", "hbs!csui/controls/settings/impl/settings", "css!csui/controls/settings/impl/settings" ], function(require, $, _, Backbone, Marionette, Accessibility, i18n, TabableRegionBehavior, SettingsDropDownView, SelectedColumnsView, SummaryDescriptionView, lang, template) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var SettingsView = Marionette.View.extend({
    constructor: function SettingsView(options) {
      options || (options = {});
      _.defaults(options, {
        showDefaults: true
      });
      this.plugins = _.each(options.options, function(setting, key) {
        setting.region = "#" + setting.id;
      });
      Marionette.View.call(this, options);
      this.enablePinnedColumns = this.options.searchResultsView.headerView.enablePinnedColumns && !accessibleTable;
    },
    className: "csui-settings-container",
    template: template,
    templateContext: function() {
      var context = {
        showDefaults: this.options.showDefaults,
        regions: _.map(this.plugins, function(region) {
          return region.region.substring(1);
        })
      };
      return context;
    },
    regions: function() {
      var regions = {
        settingsDropDownContainer: this.options.settingsDropDownContainer || ".settings-dropdown-container"
      };
      if (this.options.showDefaults) {
        if (this.enablePinnedColumns) {
          _.extend(regions, {
            standardView: ".csui-standard-search-view",
            tabularView: ".csui-tabular-search-view",
            allColumnsView: ".csui-all-columns-search-view",
            selectedColumnsContainer: ".selected-columns-container",
            availableColumnsContainer: ".available-columns-container",
            summaryOrDescriptionContainer: ".summary-description-container"
          });
        } else {
          _.extend(regions, {
            selectedColumnsContainer: ".selected-columns-container",
            availableColumnsContainer: ".available-columns-container",
            summaryOrDescriptionContainer: ".summary-description-container"
          });
        }
      }
      _.each(this.plugins, function(plugin) {
        regions[plugin.id] = plugin.region;
      });
      return regions;
    },
    ui: function() {
      var ui = {
        settingsDropDownContainer: ".settings-dropdown-container"
      };
      if (this.options.showDefaults) {
        if (this.enablePinnedColumns) {
          _.extend(ui, {
            standardView: ".csui-standard-search-view",
            tabularView: ".csui-tabular-search-view",
            allColumnsView: ".csui-all-columns-search-view",
            selectedColumnsContainer: ".selected-columns-container",
            availableColumnsContainer: ".available-columns-container",
            summaryOrDescriptionContainer: ".summary-description-container"
          });
        } else {
          _.extend(ui, {
            selectedColumnsContainer: ".selected-columns-container",
            availableColumnsContainer: ".available-columns-container",
            summaryOrDescriptionContainer: ".summary-description-container"
          });
        }
      }
      _.each(this.plugins, function(plugin) {
        ui[plugin.id] = plugin.region;
      });
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
        var display = this.model && this.model.get("display"), selectedColumnsCollection, availableColumnsCollection;
        this.prevModel = JSON.parse(JSON.stringify(display));
        if (display && display.display_regions) {
          selectedColumnsCollection = display.display_regions.selected;
          availableColumnsCollection = display.display_regions.available;
        }
        var availableCollection, selectedCollection;
        if (display && display.summary_description && display.summary_description.available) {
          availableCollection = display.summary_description.available;
          selectedCollection = display.summary_description.selected;
        }
        selectedColumnsCollection && selectedColumnsCollection.where({
          isNew: true
        }).map(function(model) {
          model.set({
            isNew: false
          }, {
            silent: true
          });
        });
        if (this.enablePinnedColumns) {
          optionsCollection.add([ {
            id: "standardView",
            classname: "csui-standard-view csui-search-view",
            label: lang.settingLabels.standard
          }, {
            id: "tabularView",
            classname: "csui-tabular-view csui-search-view",
            label: lang.settingLabels.list
          }, {
            id: "allColumnsView",
            classname: "csui-all-columns-view csui-search-view",
            label: lang.settingLabels.pinnedColumns
          }, {
            id: "selectedColumnsContainer",
            label: lang.columnSettingsTitle,
            showNextCard: true,
            view: new SelectedColumnsView({
              settingsView: this,
              isTabularView: this.options.isTabularView,
              tableCollection: this.options.tableCollection,
              collection: selectedColumnsCollection,
              availableColumnsCollection: availableColumnsCollection,
              settings: this.model,
              searchResultsView: this.options.searchResultsView
            })
          } ], {
            at: 0
          });
          if (!this.options.searchResultsView.collection.enablePinnedColumnsView) {
            optionsCollection.add([ {
              id: "summaryOrDescriptionContainer",
              label: lang.summaryDescriptionTitle,
              showNextCard: true,
              view: new SummaryDescriptionView({
                settingsView: this,
                selectedCollection: selectedCollection,
                availableCollection: availableCollection,
                collection: availableCollection,
                settings: this.model,
                searchResultsView: this.options.searchResultsView
              })
            } ]);
          }
        } else {
          optionsCollection.add([ {
            id: "selectedColumnsContainer",
            label: lang.columnSettingsTitle,
            showNextCard: true,
            view: new SelectedColumnsView({
              settingsView: this,
              isTabularView: this.options.isTabularView,
              tableCollection: this.options.tableCollection,
              collection: selectedColumnsCollection,
              availableColumnsCollection: availableColumnsCollection,
              settings: this.model,
              searchResultsView: this.options.searchResultsView
            })
          }, {
            id: "summaryOrDescriptionContainer",
            label: lang.summaryDescriptionTitle,
            showNextCard: true,
            view: new SummaryDescriptionView({
              settingsView: this,
              selectedCollection: selectedCollection,
              availableCollection: availableCollection,
              collection: availableCollection,
              settings: this.model,
              searchResultsView: this.options.searchResultsView
            })
          } ], {
            at: 0
          });
        }
      }
      this.settingsDropDownView = new SettingsDropDownView({
        settingsView: this,
        model: this.model,
        tableCollection: this.options.tableCollection,
        collection: optionsCollection,
        searchResultsView: this.options.searchResultsView,
        showSettings: this.showSettings.bind(this)
      });
      this.showChildView("settingsDropDownContainer", this.settingsDropDownView);
      this.currentCard = this.ui.settingsDropDownContainer;
    },
    onShow: function() {
      var self = this;
      this.$el.css("height", this.currentCard.outerHeight());
      setTimeout(function() {
        if (self.settingsDropDownView.$el.find(".binf-list-group-item a").length > 0) {
          $(self.settingsDropDownView.$el.find(".binf-list-group-item a")[0]).trigger("focus");
        }
      }, 0);
    },
    showSettings: function(regionName, childView) {
      var loaderDisabled = !!this.options.searchResultsView.$el.find(".load-container.binf-hidden").length;
      if (!this.isCardChanging && loaderDisabled) {
        this.isCardChanging = true;
        this.showChildView(regionName, childView);
        this.animate(this.currentCard, this.ui[regionName]);
        this.currentCard = this.ui[regionName];
      }
    },
    animate: function(current, next) {
      this.$el && this.$el.css("height", next.outerHeight());
      var self = this;
      if (next.index() > current.index()) {
        next.one("transitionend", function() {
          delete self.isCardChanging;
          next.addClass("csui-settings-show").removeClass("transition-show");
          next.find("[tabindex]:first").trigger("focus");
        });
        next.addClass("transition-show");
      } else {
        current.one("transitionend", function() {
          delete self.isCardChanging;
          current.removeClass("csui-settings-show transition-hide");
          next.find("[tabindex]:first").trigger("focus");
        });
        current.addClass("transition-hide");
      }
    }
  });
  return SettingsView;
});