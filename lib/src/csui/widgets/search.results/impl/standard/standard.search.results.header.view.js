/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/tabletoolbar/tabletoolbar.view", "csui/widgets/search.results/controls/expandall/expandall.view", "csui/controls/checkbox/checkbox.view", "csui/widgets/search.results/controls/sorting/sort.menu.view", "csui/controls/selected.count/selected.count.control.view", "csui/models/node/node.model", "i18n!csui/widgets/search.results/impl/nls/lang", "hbs!csui/widgets/search.results/impl/standard/standard.search.results.header", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "css!csui/widgets/search.results/impl/search.results" ], function(_, $, Backbone, Marionette, TableToolbarView, ExpandAllView, CheckboxView, SortingView, SelectedCountView, NodeModel, lang, template, ViewEventsPropagationMixin) {
  "use strict";
  var StandardSearchResultsHeaderView = Marionette.LayoutView.extend({
    template: template,
    regions: {
      expandAllRegion: "#expandAllArrow",
      sortRegion: "#csui-search-sort",
      selectAllRegion: "#selectAllCheckBox",
      toolbarRegion: "#toolbar",
      selectedCounterRegion: "#SelectedItemsCounter"
    },
    constructor: function StandardSearchResultsHeaderView(options) {
      options || (options = {});
      this.collection = options.collection;
      this.resultsView = options.view;
      this.options = options.options;
      this.localStorage = options.localStorage;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.setSelectAllView();
      this.setSortingView();
      this.setExpandAllView();
      this._setToolBar();
      this._setSelectionCounterView();
      this.listenTo(this.collection, "sync", this._removeAllSelections);
      this.listenTo(this.collection, "reset", function() {
        this.expandAllView.pageChange();
      });
      this.listenTo(this, "dom:refresh", this._refreshEle);
      this.listenTo(this.options.originatingView, "query:changed", function() {
        if (this.expandAllView) {
          this.expandAllView._isExpanded = false;
        }
      });
      this._commandController = this.options.originatingView.commandController;
      this.listenTo(this._commandController, "before:execute:command", function(eventArgs) {
        this.toolbarView.otherToolbarView.trigger("before:execute:command", eventArgs);
      });
      this.listenTo(this._commandController, "after:execute:command", function(eventArgs) {
        this.toolbarView.otherToolbarView.trigger("after:execute:command", eventArgs);
      });
    },
    _refreshEle: function() {
      if (this.toolbarView) {
        this.toolbarView.trigger("dom:refresh");
      }
      if (this._selectAllView) {
        this._selectAllView.triggerMethod("dom:refresh");
      }
      if (this.expandAllView) {
        this.expandAllView.triggerMethod("dom:refresh");
      }
    },
    onRender: function() {
      this.sortRegion.show(this.sortingView);
      this.expandAllRegion.show(this.expandAllView);
      this.selectedCounterRegion.show(this.selectedCounterView);
      this.selectAllRegion.show(this._selectAllView);
      this.toolbarRegion.show(this.toolbarView);
      this._updateToolItems();
    },
    _setToolBar: function() {
      var self = this, parentNode = new NodeModel({
        id: undefined
      }, {
        connector: this.collection.connector
      });
      this.collection.node = parentNode;
      this.toolbarView = new TableToolbarView({
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        collection: this.collection,
        originatingView: this.options.originatingView,
        container: this.container,
        context: this.options.context,
        toolbarCommandController: this.options.originatingView.commandController,
        events: function() {
          return _.extend({}, TableToolbarView.prototype.events, {
            keydown: self.onKeyInViewInToolbarView
          });
        }
      });
      this.listenTo(this.toolbarView, "refresh:tabindexes", function() {
        var elms = this.toolbarView.el.querySelectorAll(".csui-otherToolbar>ul>li>a");
        elms.forEach(elm => {
          elm.setAttribute("tabindex", 0);
        });
        if (this.collection.selectedItems.length <= this.collection.length && !this.collection.selectedAllItems) {
          this.trigger("selectionChanged");
        }
      });
    },
    _updateToolItems: function() {
      if (this.toolbarView) {
        var nodes = this.collection.selectedItems.models;
        if (nodes && nodes.length === 1) {
          this.toolbarView.options.collection.node = nodes[0].parent;
        } else {
          this.toolbarView.options.collection.node = new NodeModel({
            id: undefined
          }, {
            connector: this.collection.connector
          });
        }
        this.toolbarView.updateForSelectedChildren(nodes);
      }
    },
    onKeyInViewInToolbarView: function(event) {
      switch (event.keyCode) {
       case 37:
       case 39:
        event.preventDefault();
        event.stopPropagation();
        break;

       case 9:
        this.trigger("close:subMenu");
      }
    },
    _setSelectionCounterView: function() {
      this.selectedCounterView = new SelectedCountView({
        collection: this.collection.selectedItems,
        scrollableParent: ".csui-result-list"
      });
      var self = this;
      this.listenTo(this.collection.selectedItems, "checkAllItems", function() {
        self.selectedCounterView.collection.trigger("reset");
        self._updateToolItems();
      });
      this.listenTo(this.collection.selectedItems, "unCheckedAllItems", function() {
        self._updateToolItems();
        self.selectedCounterView.collection.trigger("reset");
      });
      this.listenTo(this.collection.selectedItems, "remove add", this._updateToolItems);
      this.listenTo(this.collection.selectedItems, "reset", function() {
        if (self.collection.prevSearchDisplayStyle === "StandardView") {
          self._updateToolItems();
          self.collection.selectedItems.length === 0 && self.resultsView._rowStates.set(StandardSearchResultsHeaderView.SelectedRows, []);
        }
      });
      this.listenTo(this.selectedCounterView.collection, "remove", this._updateRowsState);
    },
    _updateRowsState: function(models) {
      var updateModels = [];
      if (!(models instanceof Array)) {
        updateModels.push(models);
      } else {
        updateModels = models;
      }
      if (this.collection.prevSearchDisplayStyle === "StandardView") {
        _.each(updateModels, function(model) {
          var newSelectedModelIds = this.resultsView._rowStates.get(StandardSearchResultsHeaderView.SelectedRows);
          newSelectedModelIds = _.without(newSelectedModelIds, model.get("id"));
          this.collection.selectedItems.remove(model);
          this.resultsView._rowStates.set(StandardSearchResultsHeaderView.SelectedRows, newSelectedModelIds);
        }, this);
      }
    },
    setSelectAllView: function() {
      this._selectAllView = new CheckboxView({
        checked: this._calculateSelectAllCheckedStatus(),
        disabled: this.collection.length === 0,
        ariaLabel: lang.selectAllAria,
        title: lang.selectAll
      });
      this.listenTo(this._selectAllView, "clicked", function(e) {
        this._checkUncheckAll(e);
      });
      this.listenTo(this.resultsView._rowStates, "change:" + StandardSearchResultsHeaderView.SelectedRows, function() {
        this._updateSelectAllCheckbox();
      });
      this.listenTo(this.collection, "reset", function() {
        this._updateSelectAllCheckbox();
      });
    },
    _checkUncheckAll: function(e) {
      e.cancel = true;
      var self = this;
      var checked = this._selectAllView.model.get("checked");
      this.collection.selectedAllItems = true;
      if (checked === "true") {
        var modelIds = this.resultsView._rowStates.get(StandardSearchResultsHeaderView.SelectedRows);
        modelIds && modelIds.map(function(modelId) {
          var model = self.collection.selectedItems.models.filter(function(model) {
            return model.attributes && model.attributes.id === modelId;
          });
          self.collection.selectedItems.remove(model, {
            silent: true
          });
        });
        this.collection.selectedItems.reset(_.clone(this.collection.selectedItems.models), {
          silent: true
        });
        this.collection.selectedItems.trigger("unCheckedAllItems");
        this.resultsView._rowStates.set(StandardSearchResultsHeaderView.SelectedRows, []);
      } else {
        var ids = [];
        this.collection && this.collection.models.map(function(model) {
          if (!model.get("selectable")) {
            var id = model.get("id");
            ids.push(id);
            model.set("csuiIsSelected", true, {
              silent: true
            });
            self.collection.selectedItems.add(model, {
              silent: true
            });
          }
        });
        this.collection.selectedItems.reset(_.clone(this.collection.selectedItems.models), {
          silent: true
        });
        this.collection.selectedItems.trigger("checkAllItems");
        this.resultsView._rowStates.set(StandardSearchResultsHeaderView.SelectedRows, ids);
      }
      this._selectAllView.ui.cb.trigger("focus");
    },
    _updateSelectAllCheckbox: function() {
      if (this._selectAllView) {
        this._selectAllView.setChecked(this._calculateSelectAllCheckedStatus());
        this._selectAllView.setDisabled(this.collection.length === 0);
      }
    },
    _removeAllSelections: function() {
      var selectedItems = [];
      var listOfSelectedItems = this.collection && this.collection.selectedItems && this.collection.selectedItems.models.map(function(model) {
        return model.get("id");
      });
      this.collection && this.collection.models.map(function(model) {
        if (listOfSelectedItems.indexOf(model.get("id")) > -1) {
          selectedItems.push(model.get("id"));
        }
      });
      selectedItems.length && this.resultsView._rowStates.set({
        selected: []
      }, {
        silent: true
      });
      this.resultsView._rowStates.set(StandardSearchResultsHeaderView.SelectedRows, selectedItems);
    },
    _calculateSelectAllCheckedStatus: function() {
      var selected = this.resultsView._rowStates.get(StandardSearchResultsHeaderView.SelectedRows);
      if (selected && selected.length) {
        var all = selected.length === this.collection.length;
        if (selected.length > 0 && !all) {
          return "mixed";
        } else {
          return selected.length > 0;
        }
      }
    },
    setSortingView: function() {
      this.sortingView = new SortingView({
        collection: this.collection,
        enableSorting: this.options.enableSorting !== undefined ? this.options.enableSorting : true
      });
      return true;
    },
    setExpandAllView: function() {
      this.expandAllView = new ExpandAllView({
        collection: this.collection,
        view: this.resultsView,
        _eleCollapse: "standard-search-expandArrowUp",
        _eleExpand: "standard-search-expandArrowDown"
      });
      return this.expandAllView;
    }
  }, {
    SelectedRows: "selected"
  });
  _.extend(StandardSearchResultsHeaderView.prototype, ViewEventsPropagationMixin);
  return StandardSearchResultsHeaderView;
});