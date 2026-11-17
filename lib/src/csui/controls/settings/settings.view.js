/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette3", "csui/utils/accessibility", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "i18n!csui/controls/settings/impl/nls/lang", "hbs!csui/controls/settings/impl/settings", "csui/controls/otc.menu/menu.items.view", "csui/utils/commonconfig.util", "smart/controls/table.settings/table.settings.columns.side.panel.view", "csui/controls/globalmessage/globalmessage", "csui/controls/settings/impl/summary.description", "css!csui/controls/settings/impl/settings" ], function(module, $, _, Backbone, Marionette, Accessibility, TabableRegionBehavior, lang, template, MenuItemsView, CommonConfig, TableSettingsColumnsSidePanelView, GlobalMessage, SummaryDescription) {
  "use strict";
  const accessibleTable = Accessibility.isAccessibleTable();
  let config = module.config();
  _.defaults(config, {
    enableCustomConfiguration: CommonConfig.enableFeatureInSmartView() || false,
    enableSummaryDescription: true
  });
  const SettingsView = Marionette.View.extend({
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
      var optionsCollection = new Backbone.Collection(this.options.options);
      if (this.options.showDefaults) {
        const display = this.model?.get("display");
        if (display && display.summary_description && display.summary_description.available) {
          this.availableCollection = display.summary_description.available;
          this.selectedSummaryDesc = display.summary_description.selected;
        }
        const selectedItem = this.options.tableCollection?.prevSearchDisplayStyle;
        if (this.enablePinnedColumns) {
          optionsCollection.add([ {
            id: "standardView",
            classname: "csui-standard-view csui-search-view",
            displayName: lang.settingLabels.standard,
            checked: selectedItem === "StandardView"
          }, {
            id: "tabularView",
            classname: "csui-tabular-view csui-search-view",
            displayName: lang.settingLabels.list,
            checked: selectedItem === "TabularView"
          }, {
            id: "allColumnsView",
            classname: "csui-all-columns-view csui-search-view",
            displayName: lang.settingLabels.pinnedColumns,
            checked: selectedItem === "AllColumnsView"
          }, {
            overrideChildElm: "otc-menudivider"
          }, {
            id: "selectedColumnsContainer",
            displayName: lang.columnSettingsTitle,
            showNextCard: true,
            overrideChildElm: "otc-menuitem"
          } ]);
          if (!this.options.searchResultsView.collection.enablePinnedColumnsView && config.enableSummaryDescription) {
            this.createSettingDescriptionMenu();
          }
        } else {
          optionsCollection.add([ {
            id: "selectedColumnsContainer",
            displayName: lang.columnSettingsTitle,
            overrideChildElm: "otc-menuitem"
          } ]);
          config.enableSummaryDescription && this.createSettingDescriptionMenu();
        }
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
        if (itemValue.get("id") === "selectedColumnsContainer") return;
        if (itemValue.get("id") === "allColumnsView") {
          this.summaryDescription?.el.remove();
          this.summaryDescription = undefined;
        } else {
          if (!this.el.querySelector("otc-submenu")) config.enableSummaryDescription && this.createSettingDescriptionMenu();
          this.summaryDescription && this.sortMenuSelectGroupView.el.after(this.summaryDescription.el);
        }
        this.el.querySelector("otc-menu")?.removeAttribute("isopen");
        this.closeMenu();
      });
      this.sortMenuSelectGroupView.render();
      this._regions.searchSettingId.show(this.sortMenuSelectGroupView);
      this.summaryDescription && this.sortMenuSelectGroupView.el.after(this.summaryDescription.el);
    },
    createSettingDescriptionMenu: function() {
      this.availableCollection.models.map(model => {
        model.attributes.displayName = model.attributes.name;
        model.attributes.id = model.attributes.key;
        model.attributes.checked = this.selectedSummaryDesc === model.attributes.key;
      });
      this.summaryDescription = new SummaryDescription({
        availableCollection: this.availableCollection,
        childElm: "otc-menuradio",
        parentElm: "otc-submenu",
        name: lang.summaryDescriptionTitle,
        settingsView: this
      });
      this.summaryDescription.render();
      this.listenTo(this.summaryDescription, "otc:submenu:select", function({
        itemValue
      }) {
        this.showSettingsView(itemValue);
        this.el.querySelector("otc-menu")?.removeAttribute("isopen");
      });
    },
    closeMenu: function() {
      this.trigger("close:menu");
    },
    showSettingsView: function(model) {
      let data = new FormData();
      const summary_description = model.get("key");
      this.model.get("display").summary_description.selected = model.get("key");
      if (!!summary_description) {
        this.options.searchResultsView.blockActions();
        data.append("summary_description", summary_description);
        this.model.save(null, {
          parse: false,
          data: data,
          processData: false,
          cache: false,
          contentType: false
        }).done(_.bind(function(response) {
          this.trigger("update:showSummaryDescriptions");
          this.options.searchResultsView.executeEndProcess();
          this.options.originatingView.trigger("render:table");
          this.options.searchResultsView.headerView.data = {};
          this.options.searchResultsView.unblockActions();
        }, this)).fail(function(error) {
          error = new base.Error(error);
          GlobalMessage.showMessage("error", error.message);
          this.options.searchResultsView.unblockActions();
        });
      }
    },
    onShowSettings: function(view, event) {
      if (this.enablePinnedColumns && (event.currentTarget.id === "standardView" || event.currentTarget.id === "tabularView" || event.currentTarget.id === "allColumnsView")) {
        view.set("selected", true);
        this.options.searchResultsView.headerView.trigger("view:changed", event);
      } else {
        var loaderDisabled = !!this.options.searchResultsView.$el.find(".load-container.binf-hidden").length;
        if (loaderDisabled) {
          if (!config.enableCustomConfiguration || view.get("id") === "summaryOrDescriptionContainer") {
            this.options.settingsView.showSettings(view.get("id"), view.model.get("view"));
          } else {
            this.showTableSidePanel();
          }
        }
      }
    },
    mergeConfiguredColumns: function(searchColumns, configuredColumns, prop) {
      configuredColumns.forEach(configuredColumnObj => {
        let searchColumnObj = searchColumns.find(searchColumnObj => {
          return searchColumnObj.get(prop) === configuredColumnObj.get(prop);
        });
        if (searchColumnObj) {
          Object.assign(searchColumnObj.attributes, configuredColumnObj.attributes);
        }
      });
      return searchColumns;
    },
    getColumnSequence: function(tableColumn, column, options) {
      let sequence = options.withCustomizations && column ? column.get ? column.get("customization_order") : column["customization_order"] : undefined;
      if (!sequence) {
        sequence = tableColumn ? tableColumn.get ? tableColumn.get("sequence") : tableColumn["sequence"] : undefined;
        if (sequence == null) {
          sequence = column ? column.get ? column.get("definitions_order") : column["definitions_order"] : undefined;
          if (!sequence && sequence !== undefined) {
            sequence = undefined;
          }
        }
      }
      return sequence;
    },
    collectRemovedColumns: function(collection) {
      let removedColumns = [];
      let resize_span_end, resize_span_initiator, resize_span_initiator_is_pinned, columnsForRemoval;
      collection.forEach((column, index, all) => {
        const column_key = column.get("column_key");
        if (resize_span_end) {
          const pinned = column.get("customization_pinned");
          if (pinned === resize_span_initiator_is_pinned) {
            columnsForRemoval.push(column_key);
            if (column_key === resize_span_end) {
              removedColumns.push(...columnsForRemoval);
              resize_span_end = "";
              resize_span_initiator = "";
              columnsForRemoval = [];
            }
          } else {
            resize_span_end = "";
          }
        }
        if (!resize_span_end) {
          const span = column.get("customization_resize_span");
          if (span && span !== column_key) {
            resize_span_end = span;
            resize_span_initiator = column_key;
            resize_span_initiator_is_pinned = column.get("customization_pinned");
            columnsForRemoval = [];
          }
        }
      });
      return removedColumns;
    },
    showTableSidePanel() {
      require([ "csui/models/widget/search.results/search.metadata/search.columns" ], _.bind(function(searchConfiguredColumns) {
        let allColumns, selectedColumns, displayableColumns, tableColumnsByKey;
        let display = this.model && this.model.get("display"), selectedColumnsCollection, availableColumnsCollection;
        if (display && display.display_regions) {
          selectedColumnsCollection = display.display_regions.selected;
          availableColumnsCollection = display.display_regions.available;
        }
        const configuredColumns = searchConfiguredColumns.deepClone().models;
        let searchColumns = this.options.searchResultsView.columns.models;
        searchColumns = this.mergeConfiguredColumns(searchColumns, configuredColumns, "key");
        tableColumnsByKey = Object.fromEntries(configuredColumns.map(column => [ column.get("key"), column ]));
        displayableColumns = _.sortBy(searchColumns, column => {
          return this.getColumnSequence(tableColumnsByKey[column.get("column_key")], column, {
            withCustomizations: false
          });
        });
        const removedColumns = this.collectRemovedColumns(displayableColumns);
        function rejectSpannedColumns(column) {
          const column_key = column.get("column_key");
          return removedColumns.includes(column_key);
        }
        function panelColumn(column) {
          const key = column.get("column_key") || column.get("key");
          const tableColumn = tableColumnsByKey[key];
          return {
            id: key,
            name: tableColumn && (tableColumn.get("name") || tableColumn.get("title")) || column.get("name") || column.get("titleAttr"),
            type: column.get("type"),
            permanent: tableColumn ? tableColumn.get("permanentColumn") === true : false,
            pinned: tableColumn ? tableColumn.get("customization_pinned") === true : false,
            default: column.get("is_default_column") !== false,
            label: column.get("additional_name"),
            group: column.get("column_group"),
            permanentAtEnd: tableColumn ? tableColumn.get("permanentAtEnd") === true : false
          };
        }
        selectedColumns = new Backbone.Collection(_.reject(displayableColumns, rejectSpannedColumns).map(panelColumn));
        const displayRegionsAllColumns = this.options.searchResultsView.headerView.displayRegionsAllColumns;
        if (displayRegionsAllColumns) {
          allColumns = new Backbone.Collection(displayRegionsAllColumns);
        } else {
          const _selectedColumns = selectedColumns.models.reduce((r, o) => {
            r[o.get("permanentAtEnd") ? "permanentAtEndList" : "selectedColumnsList"].push(o);
            return r;
          }, {
            permanentAtEndList: [],
            selectedColumnsList: []
          });
          allColumns = new Backbone.Collection([ ..._selectedColumns.selectedColumnsList, ...availableColumnsCollection.map(panelColumn), ..._selectedColumns.permanentAtEndList ]);
        }
        function formatDisplayRegions(collection) {
          return "{" + collection.pluck("id").map(function(id) {
            return "'" + id + "'";
          }).join(",") + "}";
        }
        const initialDisplayRegions = formatDisplayRegions(selectedColumns);
        selectedColumns.stopListening(selectedColumns, "update reset").listenTo(selectedColumns, "update reset", () => {
          const updatedDisplayRegions = formatDisplayRegions(selectedColumns);
          if (updatedDisplayRegions !== initialDisplayRegions) {
            this.model.set("selectedColumns", selectedColumns, {
              silent: true
            });
            this.options.searchResultsView.headerView.displayRegionsAllColumns = allColumns.map(this.panelAllColumn);
            this.options.searchResultsView.headerView.data.display_regions = updatedDisplayRegions;
            this.showSelectedColumns();
          }
        });
        const sp = new TableSettingsColumnsSidePanelView({
          allColumns: allColumns,
          selectedColumns: selectedColumns,
          orderBy: [ "name" ]
        });
        sp.show();
      }, this));
    },
    showSelectedColumns: function() {
      var data = new FormData(), display_regions = this.options.searchResultsView.headerView.data.display_regions;
      if (!!display_regions) {
        this.options.searchResultsView.blockActions();
        data.append("display_regions", display_regions);
        this.options.model.save(null, {
          parse: false,
          data: data,
          processData: false,
          cache: false,
          contentType: false
        }).done(_.bind(function(response) {
          this.options.searchResultsView.trigger("queryTools:update");
          this.options.searchResultsView.collection.settings_changed = true;
          this.options.tableCollection.fetch();
          this.isChanged = false;
          this.options.searchResultsView.headerView.data = {};
          this.options.searchResultsView.unblockActions();
        }, this)).fail(_.bind(function(error) {
          error = new base.Error(error);
          GlobalMessage.showMessage("error", error.message);
          this.options.searchResultsView.unblockActions();
        }, this));
      }
    }
  });
  return SettingsView;
});