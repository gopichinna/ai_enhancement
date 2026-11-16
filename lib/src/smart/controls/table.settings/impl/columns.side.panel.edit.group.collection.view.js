/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/table.settings/impl/columns.side.panel.edit.group.view", "i18n!smart/controls/table.settings/impl/nls/lang" ], function(module, _, Backbone, Marionette, ColumnsSidePanelEditGroupView, lang) {
  const ColumnsSidePanelEditGroupCollectionView = Marionette.CollectionView.extend({
    childView: ColumnsSidePanelEditGroupView,
    className: "smart-table-settings-columns-edit-collection-view",
    tagName: "div",
    constructor: function ColumnsSidePanelEditGroupCollectionView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.options || (this.options = {});
      this.allColumnsCollection = this.options.allColumns;
      this.selectedColumns = this.options.selectedColumns;
      this._manuallyExpandedGroups = {};
      this.collection = new Backbone.Collection();
      this.listenTo(this.collection, "change:expanded", () => {
        if (!this._searchTerm) {
          this._saveExpandedState();
        }
      });
      this.listenTo(this.selectedColumns, "reset", () => {
        this._resetViewCollection(this._searchTerm);
      });
      this._resetViewCollection();
    },
    onRender: function() {
      this.el.setAttribute("id", this.options.id);
      if (this._haveOtherGroups) {
        this.el.setAttribute("role", "list");
        this.el.setAttribute("aria-label", lang.columnGroupsListAria);
      }
    },
    _saveExpandedState: function() {
      this._manuallyExpandedGroups = {};
      this.collection.each((groupModel, index) => {
        this._manuallyExpandedGroups[index] = !!groupModel.get("expanded");
      });
    },
    _resetViewCollection: function(filterLowerCase = "") {
      const undefinedGroupName = this.options.ungroupedFirst ? "aaaaaaaaaaaaaaa___ungrouped" : "zzzzzzzzzzzzzzz___ungrouped";
      const filteredAllColumns = this.allColumnsCollection.filter(model => {
        if (model.get("permanent") || model.get("pinned")) {
          return false;
        }
        if (filterLowerCase) {
          let name = model.get("name");
          if (name === undefined) {
            name = "";
          }
          name = name.toLowerCase();
          return name.includes(filterLowerCase);
        } else {
          return true;
        }
      });
      const allColumnsModels = filteredAllColumns.map(allColumnsModel => {
        const isPinned = allColumnsModel.get("pinned");
        const isPermanent = allColumnsModel.get("permanent");
        const id = allColumnsModel.get("id");
        const selectedModel = this.selectedColumns.get(id);
        const group = allColumnsModel.get("group");
        const name = _.isString(allColumnsModel.get("name")) ? allColumnsModel.get("name").trim() : "";
        let namePrefix = "";
        let nameSuffix = "";
        let nameMatch = "";
        if (filterLowerCase.length > 0) {
          const start = name.toLowerCase().indexOf(filterLowerCase);
          if (start >= 0) {
            const end = start + filterLowerCase.length;
            namePrefix = name.substring(0, start);
            nameMatch = name.substring(start, end);
            nameSuffix = name.substring(end);
          }
        }
        return {
          id: id,
          type: "column",
          name: name,
          namePrefix: namePrefix,
          nameMatch: nameMatch,
          nameSuffix: nameSuffix,
          label: allColumnsModel.get("label"),
          group: group ? group : undefinedGroupName,
          fixed: !!(isPinned || isPermanent),
          permanentAtEnd: allColumnsModel.get("permanentAtEnd"),
          selected: selectedModel !== undefined
        };
      });
      const columnGroupModels = [];
      const grouped = _.groupBy(allColumnsModels, "group");
      const groupedKeys = Object.keys(grouped);
      const groups = groupedKeys.toSorted((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower < bLower) {
          return -1;
        }
        if (aLower > bLower) {
          return 1;
        }
        return 0;
      });
      groups.forEach((groupName, index) => {
        const groupChildren = grouped[groupName];
        const sortedGroupChildren = _.sortBy(groupChildren, "name");
        let name;
        if (groupName === undefinedGroupName) {
          name = lang.ungroupedHeaderName;
        } else {
          this._haveOtherGroups = true;
          name = groupName;
        }
        const expanded = Object.keys(this._manuallyExpandedGroups).length === 0 && index === 0 || filterLowerCase.length > 0 || this._manuallyExpandedGroups[index];
        let groupModel = {
          name: name,
          type: "group",
          expanded: expanded,
          children: sortedGroupChildren,
          allColumns: this.allColumnsCollection,
          selectedColumns: this.selectedColumns
        };
        columnGroupModels.push(groupModel);
      });
      this.collection.reset(columnGroupModels);
    },
    childViewOptions: function(model, index) {
      return {
        haveOnlyUngrouped: !this._haveOtherGroups
      };
    },
    getSelectedColumns: function() {
      return new Backbone.Collection(this.selectedColumns.map(column => {
        const id = column.id;
        return this.allColumnsCollection.get(id);
      }));
    },
    setFilter: function(filter) {
      const filterLowerCase = filter ? filter.toLowerCase() : "";
      this._searchTerm = filterLowerCase;
      this._resetViewCollection(filterLowerCase);
    }
  });
  return ColumnsSidePanelEditGroupCollectionView;
});