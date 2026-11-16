/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/controls/table.settings/impl/keyboard.navigation.mixin", "smart/controls/table.settings/impl/columns.side.panel.edit.collection.view", "hbs!smart/controls/table.settings/impl/columns.side.panel.edit.group", "css!smart/controls/table.settings/impl/columns.side.panel.edit.group.view" ], function(module, _, Backbone, Marionette, logUtil, KeyboardNavigationMixin, ColumnsSidePanelEditCollectionView, template) {
  const log = logUtil(module.id);
  const ColumnsSidePanelEditGroupView = Marionette.LayoutView.extend({
    className: "smart-table-settings-columns-edit-group-view",
    template: template,
    tagName: "div",
    regions: {
      "children-region": ".columns-side-panel-edit-group-children-region"
    },
    ui: {
      button: ".columns-side-panel-edit-group-button",
      header: ".columns-side-panel-edit-group-header",
      icon: ".columns-side-panel-edit-group-button > otc-icon"
    },
    events: {
      "click .columns-side-panel-edit-group-button": "_toggleExpand",
      keydown: "onKeyInView"
    },
    constructor: function ColumnsSidePanelEditGroupView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.options || (this.options = {});
      this.selectedColumns = this.model.get("selectedColumns");
      this._haveOnlyUngrouped = this.options.haveOnlyUngrouped;
      if (this._haveOnlyUngrouped) {
        this.model.set("expanded", true);
      }
      this._groupName = this.model.get("name");
      this._groupId = `group_${this._groupName}`;
      this.listenTo(this.model, "change:expanded", this._handleCollapseChanged);
      this.columnsCollection = new Backbone.Collection();
      if (this.model.get("expanded")) {
        this.columnsCollection.reset(this.model.get("children"));
      }
      this.listenTo(this.columnsCollection, "change:selected", this.onColumnSelectionChanged);
      this._initializeKN();
    },
    onColumnSelectionChanged: function(columnModel) {
      const selected = columnModel.get("selected");
      const columnId = columnModel.get("id");
      const groupChildren = this.model.get("children");
      const groupChild = groupChildren.find(child => {
        return child.id === columnId;
      });
      groupChild.selected = selected;
      if (selected) {
        const selectedModel = this.selectedColumns.get(columnId);
        if (!selectedModel) {
          const allColumns = this.model.get("allColumns");
          const column = allColumns.find(child => {
            return child.get("id") === columnId;
          });
          this.selectedColumns.add(column);
        }
      } else {
        this.selectedColumns.remove(columnId);
      }
    },
    onRender: function() {
      if (!this._haveOnlyUngrouped) {
        this.el.setAttribute("role", "listitem");
      }
      this.collectionView = new ColumnsSidePanelEditCollectionView({
        collection: this.columnsCollection,
        groupId: this._groupId,
        groupName: this._groupName
      });
      this.showChildView("children-region", this.collectionView);
    },
    templateHelpers: function() {
      return {
        haveOnlyUngrouped: this._haveOnlyUngrouped,
        expanded: !!this.model.get("expanded"),
        groupId: this._groupId
      };
    },
    _toggleExpand: function() {
      const expanded = this.model.get("expanded");
      this.model.set("expanded", !expanded);
    },
    _handleCollapseChanged: function() {
      const expanded = this.model.get("expanded");
      this.ui.button.attr("aria-expanded", expanded);
      if (expanded) {
        this.ui.header.addClass("group--is-expanded");
        this.ui.icon.attr("icon", "smart_action:action_caret_up32");
        this.columnsCollection.reset(this.model.get("children"));
      } else {
        this.ui.header.removeClass("group--is-expanded");
        this.ui.icon.attr("icon", "smart_action:action_caret_down32");
        this.columnsCollection.reset([]);
      }
    },
    onKeyInView: function(event) {
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      switch (event.keyCode) {
       case 38:
        break;

       case 40:
        break;
      }
    },
    getSelectedColumns: function() {
      return this.model.get("children").filter(column => {
        return column.selected;
      });
    },
    _initializeKN: function() {
      this.setupKeyboardNavigationMixin({
        isTabRegion: true,
        tabRegionName: this.constructor.name
      });
      const knViewsCollection = this.knGetKnViewsCollection();
      this.listenTo(knViewsCollection, "add", (model, collection, index) => {
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this.listenTo(this, "remove:child", () => {
        this._handleKnViewsUpdated(knViewsCollection);
      });
    },
    _handleKnViewsUpdated: function(knViewsCollection) {
      this._knColumnsListUpdateTabStops();
      log.debug(`KN: ### knViews collection (scope ${knViewsCollection.knScope}) changed: ###`) && console.log(log.last);
      this.knGetKnViewsSorted().forEach(knViewInfo => {
        log.debug(`KN: knViews collection (scope ${knViewsCollection.knScope}) has view with id ${knViewInfo.id} (${knViewInfo.view.constructor.name})`) && console.log(log.last);
      });
    },
    _knColumnsListUpdateTabStops: function() {}
  });
  KeyboardNavigationMixin.mixin(ColumnsSidePanelEditGroupView.prototype);
  return ColumnsSidePanelEditGroupView;
});