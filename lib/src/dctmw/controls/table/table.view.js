/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import ConnectorFactory from "nuc/contexts/factories/factory";

import BlockingView from "smart/controls/progressblocker/blocker";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import TableActionBarView from "csui/controls/tableactionbar/tableactionbar.view";

import CSUITableView from "csui/controls/table/table.view";

import SelectCellView from "csui/controls/table/cells/select/select.view";

import PaginationView from "csui/controls/pagination/nodespagination.view";

import commands from "csui/utils/commands";

import TableToolbarView from "dctmw/controls/table/tabletoolbar.view";

import tableColumns from "dctmw/controls/table/table.columns";

import toolbarItems from "dctmw/controls/table/toolbaritems";

import ToolbarItemsMasks from "dctmw/controls/table/toolbaritems.masks";

import defaultActionItems from "dctmw/models/default.action.items";

import Session from "dctmw/utils/authenticators/session";

import template from "hbs!dctmw/controls/table/impl/table.view";

import "css!dctmw/controls/table/impl/table.view";

const pMap = new Map();

function isPaginated(tableView) {
  return !!pMap.get(tableView.cid);
}

class TableView extends LayoutView {
  static columnCustomizationKeys = CSUITableView.columnCustomizationKeys;
  template = template;
  className() {
    return "d4-simple-table-container";
  }
  ui() {
    return {
      tableToolbarView: ".d4-simple-table-toolbar",
      tableView: ".csui-table-view",
      paginationView: ".csui-pagination-view"
    };
  }
  regions() {
    return {
      rgnTableToolbar: "@ui.tableToolbarView",
      rgnTable: "@ui.tableView",
      rgnPagination: "@ui.paginationView"
    };
  }
  constructor(options = {}) {
    options.context ??= Session.get().getContext();
    super(options);
    this.propagateEventsToRegions();
    const paginated = _.isBoolean(options.isPaginated) ? options.isPaginated : true;
    pMap.set(this.cid, paginated);
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.options = _.defaults(options, {
      commands: commands,
      toolbarItems: toolbarItems
    });
    this.context = options.context;
    this.commands = options.commands;
    options.collection ??= options.CollectionFactory ? this.context.getCollection(options.CollectionFactory, {
      options: _.defaults({
        expanded: true
      }, options.CollectionFactoryOptions)
    }) : new Collection();
    this.collection = options.collection;
    const ToolbarItemsMasksClass = options.ToolbarItemsMasks ?? ToolbarItemsMasks;
    options.toolbarItemsMasks ??= new ToolbarItemsMasksClass(_.defaults({
      collection: this.collection
    }, options));
    const allSelectedNodes = new Collection();
    if (this.collection.modelId) {
      allSelectedNodes.modelId = this.collection.modelId;
    }
    this.allSelectedNodes = options.allSelectedNodes || allSelectedNodes;
    this.options.allSelectedNodes = this.allSelectedNodes;
    this._setTableView();
    this._setTableViewSelectionEventsListeners(this.tableView);
    this._setOtherTableViewEventListeners(this.tableView);
    this._setCollectionEventListener(this.tableView);
    if (!_.isEmpty(this.options.toolbarItems)) this._setToolbarView();
    isPaginated(this) && this._setPagination();
    const resizeHandler = _.throttle(_.bind(this._onResize, this), 50);
    const resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
    $(window).off(resizeTableViewEventName).on(resizeTableViewEventName, {
      view: this
    }, resizeHandler);
    this.listenToOnce(this, "destroy", () => {
      pMap.delete(this.cid);
    });
  }
  templateHelpers() {
    return {
      nonPaginated: !isPaginated(this)
    };
  }
  onRender() {
    this.$el[isPaginated(this) ? "removeClass" : "addClass"]("non-paginated");
    if (!_.isEmpty(this.options.toolbarItems)) this.rgnTableToolbar.show(this.toolbarView);
    this.rgnTable.show(this.tableView);
    isPaginated(this) && this.rgnPagination.show(this.paginationView);
  }
  onShow() {
    this.collection.ensureFetched();
  }
  _onResize() {
    this.tableView && this.tableView.trigger("dom:refresh");
  }
  _getQulaifiedNameForEvents(eventName, uiSelector) {
    return `${eventName}.${this.cid}${uiSelector ? `.${uiSelector}` : ""}`;
  }
  _setTableViewSelectionEventsListeners(tableView) {
    this.listenTo(tableView, "tableRowSelected", function(args) {
      this._addNodesToSelection(args.nodes);
    });
    this.listenTo(tableView, "tableRowUnselected", function(args) {
      this._removeNodesFromSelection(args.nodes);
    });
    this.listenTo(this.collection, "remove", model => this._removeNodesFromSelection([ model ]));
    this.listenTo(this.collection, "removed:allmodel", model => {
      this._removeNodesFromSelection([ model ]);
      this.paginationView._maintainPageSize(model, this.collection, {});
    });
    this.listenTo(this.collection, "sync", this.updateSelectionCollection);
  }
  updateSelectionCollection() {
    let selectedNodes = this.allSelectedNodes;
    if (selectedNodes.length) {
      if (!_.isFunction(this.collection.isServerSidePaginated) || !this.collection.isServerSidePaginated()) {
        let items = this.collection.allModels.filter(item => selectedNodes.get(item.get("id")));
        selectedNodes.reset(items);
      }
      this.toolbarView?.updateForSelectedChildren(selectedNodes);
    }
  }
  _addNodesToSelection(nodes) {
    if (nodes) {
      const selectedNodes = this.allSelectedNodes;
      const selectedModels = selectedNodes.models.slice(0);
      _.each(nodes, function(node) {
        if (node.get("id") !== undefined && !selectedNodes.get(node)) {
          selectedModels.push(node);
        }
      }, this);
      selectedNodes.reset(selectedModels);
      this.toolbarView?.updateForSelectedChildren(selectedNodes);
    }
  }
  _removeNodesFromSelection(nodes) {
    if (nodes) {
      const selectedNodes = this.allSelectedNodes;
      _.each(nodes, function(node) {
        selectedNodes.remove(node, {
          silent: true
        });
      }, this);
      selectedNodes.reset(_.clone(selectedNodes.models));
      this.toolbarView?.updateForSelectedChildren(selectedNodes);
    }
  }
  _setOtherTableViewEventListeners(tableView) {
    this.listenTo(tableView, "execute:defaultAction", node => {
      const args = {
        node: node
      };
      this.trigger("before:defaultAction", args);
      if (!args.cancel) {
        tableView.defaultActionController.executeAction(node, {
          context: this.options.context,
          originatingView: this,
          collection: this.collection
        }).done(() => {
          this.trigger("executed:defaultAction", args);
        });
      }
    });
  }
  _setCollectionEventListener(tableView) {
    this.listenTo(this.collection, "delayed:data:sync", () => {
      tableView.updateRow(this.collection.at(0));
    });
  }
  _getTableViewOptions() {
    return _.extend({
      enableViewState: false,
      tableColumns: tableColumns,
      connector: this.context.getObject(ConnectorFactory),
      collection: this.collection,
      columns: this.collection.columns,
      columnsWithSearch: [ "name" ],
      orderBy: this.collection.orderBy || "name asc",
      actionItems: defaultActionItems,
      commands: this.commands,
      originatingView: this,
      blockingParentView: this,
      focusView: "tableHeader",
      inlineBar: {
        viewClass: TableActionBarView,
        options: _.defaults({
          collection: this.options?.toolbarItems?.inlineActionbar,
          container: this.options.container,
          containerCollection: this.collection,
          inlineBarStyle: "csui-table-actionbar-bubble",
          forceInlineBarOnClick: false,
          showInlineBarOnHover: true,
          toolItemsMask: this.options?.toolbarItemsMasks?.toolbars?.inlineActionbar
        }, this.options?.toolbarItems?.inlineActionbar?.options)
      }
    }, this.options, isPaginated(this) ? this._getPaginationOptions() : {});
  }
  _setTableView() {
    const args = this._getTableViewOptions();
    if (!isPaginated(this)) {
      delete args["pageSize"];
      delete args["ddItemsList"];
    }
    this.tableView = new CSUITableView(args);
  }
  _setToolbarView() {
    this.toolbarView = new TableToolbarView({
      originatingView: this,
      blockingParentView: this,
      removeContainer: true,
      context: this.context,
      commands: this.commands,
      selectionToolbarName: this.options.selectionToolbarName ?? "other",
      toolbarItems: this.options.toolbarItems,
      toolbarItemsMasks: this.options.toolbarItemsMasks,
      collection: this.collection
    });
  }
  _getPaginationOptions() {
    const obj = _.extend({
      pageSize: 10,
      ddItemsList: [ 10, 30, 50, 100 ]
    }, _.pick(this.options, "pageSize", "ddItemsList"));
    if (!_.contains(obj.ddItemsList, obj.pageSize)) {
      obj.ddItemsList.push(obj.pageSize);
      obj.ddItemsList.sort();
    }
    return obj;
  }
  _setPagination() {
    const po = this._getPaginationOptions();
    this.paginationView = new PaginationView({
      collection: this.collection,
      pageSize: po.pageSize,
      defaultDDList: po.ddItemsList,
      skipPaginationUpdateRequest: true,
      blockingParentView: this
    });
  }
  reconcileSelectionState() {
    const hasSelection = this.collection.find(model => model.get(SelectCellView.isSelectedModelAttributeName));
    if (!hasSelection) {
      if (this.collection.length) {
        const model = this.collection.at(0);
        model.set(SelectCellView.isSelectedModelAttributeName, true, {
          silent: true
        });
        model.set(SelectCellView.isSelectedModelAttributeName, false);
      } else if (this?.tableView?._selectAllCheckboxRegion) {
        const selectAllView = this?.tableView?._selectAllCheckboxRegion?.currentView;
        selectAllView && selectAllView?.model?.set("checked", false);
      }
    }
  }
  onBeforeDestroy() {
    const resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
    $(window).off(resizeTableViewEventName);
    this.tableView?.destroy();
    this.paginationView?.destroy();
    this.toolbarView?.destroy();
  }
}

Object.assign(TableView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(TableView.prototype.constructor, "name", {
  value: "TableView"
});

export default TableView;