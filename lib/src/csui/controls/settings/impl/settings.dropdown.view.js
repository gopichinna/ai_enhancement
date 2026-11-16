/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette3", "csui/controls/globalmessage/globalmessage", "i18n!csui/controls/settings/impl/nls/lang", "csui/utils/base", "csui/controls/settings/selected.columns/selected.columns.view", "csui/models/widget/search.results/search.metadata/search.columns", "csui/controls/settings/summary.description/summary.description.view", "smart/controls/table.settings/table.settings.columns.side.panel.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/commonconfig.util", "hbs!csui/controls/settings/impl/settings.dropdown" ], function(module, $, _, Backbone, Marionette, GlobalMessage, lang, base, SelectedColumnsView, searchConfiguredColumns, SummaryDescriptionView, TableSettingsColumnsSidePanelView, TabableRegionBehavior, CommonConfig, template) {
  "use strict";
  let config = module.config();
  _.defaults(config, {
    enableCustomConfiguration: CommonConfig.enableFeatureInSmartView() || false
  });
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
    },
    showColumnsSettings: function(event) {
      var display = this.model && this.model.get("display"), selectedColumnsCollection, availableColumnsCollection;
      if (display && display.display_regions) {
        selectedColumnsCollection = display.display_regions.selected;
        availableColumnsCollection = display.display_regions.available;
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
      this.options.showSettings("selectedColumnsContainer", new SelectedColumnsView({
        settingsDropDownView: this,
        tableCollection: this.options.tableCollection,
        collection: selectedColumnsCollection,
        availableColumnsCollection: availableColumnsCollection,
        settings: this.model
      }));
    },
    showSummaryOrDescription: function(event) {
      var display = this.model && this.model.get("display"), availableCollection, selectedCollection;
      if (display.summary_description && display.summary_description.available) {
        availableCollection = display.summary_description.available;
        selectedCollection = display.summary_description.selected;
      }
      this.options.originatingView.showSettings("summaryOrDescriptionContainer", new SummaryDescriptionView({
        settingsDropDownView: this,
        selectedCollection: selectedCollection,
        availableCollection: availableCollection,
        collection: availableCollection,
        settings: this.model
      }));
    }
  });
  var SettingsDropDownView = Marionette.CollectionView.extend({
    constructor: function SettingsDropDownView() {
      this.focusIndex = 0;
      Marionette.CollectionView.apply(this, arguments);
      this.enablePinnedColumns = this.options.settingsView.enablePinnedColumns;
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
    panelAllColumn: function(column) {
      return {
        id: column.get("id"),
        name: column.get("name"),
        type: column.get("type"),
        permanent: column.get("permanent"),
        pinned: column.get("pinned"),
        default: column.get("default"),
        label: column.get("label"),
        group: column.get("group"),
        permanentAtEnd: column.get("permanentAtEnd")
      };
    },
    showTableSidePanel() {
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
    },
    onShowSettings: function(view, event) {
      if (this.enablePinnedColumns && (event.currentTarget.id === "standardView" || event.currentTarget.id === "tabularView" || event.currentTarget.id === "allColumnsView")) {
        const settingsEle = this.el.closest(".csui-search-settings").querySelector(".csui-setting-icon");
        this.collection.findWhere({
          selected: true
        }).unset("selected");
        view.model.set("selected", true);
        this.options.settingsView.triggerMethod("close:menu", event);
        this.options.searchResultsView.headerView.trigger("view:changed", event);
        settingsEle.focus();
        settingsEle.setAttribute("tabindex", 0);
      } else {
        var loaderDisabled = !!this.options.searchResultsView.$el.find(".load-container.binf-hidden").length;
        if (loaderDisabled) {
          if (!config.enableCustomConfiguration || view.model.get("id") === "summaryOrDescriptionContainer") {
            this.options.settingsView.showSettings(view.model.get("id"), view.model.get("view"));
          } else {
            this.showTableSidePanel();
          }
        } else {
          event.preventDefault();
          event.stopPropagation();
        }
      }
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
          this.options.settingsView.isChanged = false;
          this.options.searchResultsView.headerView.data = {};
          this.options.searchResultsView.unblockActions();
        }, this)).fail(_.bind(function(error) {
          error = new base.Error(error);
          GlobalMessage.showMessage("error", error.message);
          this.options.searchResultsView.unblockActions();
        }, this));
      }
    },
    onShowSettingsDropdown: function(view, event) {
      var keyCode = event.keyCode, focusables = this.$el.find("a[tabindex]"), loaderDisabled = !!this.options.searchResultsView.$el.find(".load-container.binf-hidden").length, settingsEle = this.el.closest(".csui-search-settings").querySelector(".csui-setting-icon");
      if (!loaderDisabled) {
        event.stopPropagation();
        event.preventDefault();
      } else if (keyCode === 27 || keyCode === 9 && event.target && (event.target.id === "summaryOrDescriptionContainer" && !event.shiftKey || event.target.id === "selectedColumnsContainer" && event.shiftKey)) {
        settingsEle.focus();
        settingsEle.setAttribute("aria-expanded", "false");
        this.options.settingsView.triggerMethod("close:menu", event);
        event.preventDefault();
        event.stopPropagation();
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
  return SettingsDropDownView;
});