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

import TableToolbarView from "csui/controls/tabletoolbar/tabletoolbar.view";

import TableActionBarView from "csui/controls/tableactionbar/tableactionbar.view";

import TableView from "csui/controls/table/table.view";

import PaginationView from "csui/controls/pagination/nodespagination.view";

import commands from "csui/utils/commands";

import Session from "dctmw/utils/authenticators/session";

import defaultActionItems from "d2/models/base.default.action.items";

import columns from "d2/models/base.columns";

import AviatorAssignmentsCollectionFactory from "d2/utils/contexts/factories/aviator.assignments.collection.factory";

import AviatorConfigModelFactory from "d2/utils/contexts/factories/aviator.config.model.factory";

import assignmentToolitems from "d2/widgets/admin/aviator.config/aviator.assignments.toolbaritems";

import AviatorAssignmentsToolbarItemsMasks from "d2/widgets/admin/aviator.config/aviator.assignments.toolbaritems.masks";

import template from "hbs!d2/widgets/admin/aviator.config/impl/assignments.table";

import "css!d2/widgets/admin/aviator.config/impl/assignments.table";

class AssignmentsTableView extends LayoutView {
  template = template;
  className() {
    return "av4r-assignments-table-container";
  }
  ui() {
    return {
      tableToolbarView: ".av4r-assignments-table-toolbar",
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
    options.context = options.context || Session.get().getContext();
    super(options);
    this.propagateEventsToRegions();
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.options = _.defaults(options, {
      commands: commands,
      toolbarItems: assignmentToolitems
    });
    this.context = options.context;
    this.commands = options.commands;
    this.configModel = options.config || options.context.getModel(AviatorConfigModelFactory);
    this.collection = options.collection || this.context.getCollection(AviatorAssignmentsCollectionFactory, {
      options: {
        expanded: true
      }
    });
    this.options.toolbarItemsMasks = new AviatorAssignmentsToolbarItemsMasks(_.defaults({
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
    this._setToolbarView();
    this._setPagination();
    const resizeHandler = _.throttle(_.bind(this._onResize, this), 50);
    const resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
    this.listenTo(this.collection, "reset update", this.checkAndDisableAddButton);
    this.listenTo(this.configModel, "change:is_enabled", this.checkAndDisableAddButton.bind(this));
    $(window).off(resizeTableViewEventName).on(resizeTableViewEventName, {
      view: this
    }, resizeHandler);
  }
  onRender() {
    this.rgnTableToolbar.show(this.toolbarView);
    this.rgnTable.show(this.tableView);
    this.rgnPagination.show(this.paginationView);
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
    this.listenTo(this.collection, "sync", () => {
      let selectedNodes = this.allSelectedNodes;
      if (selectedNodes.length) {
        let items = this.collection.allModels.filter(item => selectedNodes.get(item.get("id")));
        selectedNodes.reset(items);
        this.toolbarView.updateForSelectedChildren(selectedNodes);
      }
    });
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
      this.toolbarView.updateForSelectedChildren(selectedNodes);
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
      this.toolbarView.updateForSelectedChildren(selectedNodes);
      this.checkAndDisableAddButton();
    }
  }
  _setTableView() {
    const args = _.extend({
      enableViewState: false,
      tableColumns: columns,
      connector: this.context.getObject(ConnectorFactory),
      collection: this.collection,
      columns: this.collection.columns,
      columnsWithSearch: [ "name" ],
      orderBy: "name asc",
      actionItems: defaultActionItems,
      commands: this.commands,
      originatingView: this,
      blockingParentView: this,
      focusView: "tableHeader",
      inlineBar: {
        viewClass: TableActionBarView,
        options: _.extend({
          collection: this.options.toolbarItems.tableInlineActionbar,
          dropDownIconName: "csui_action_more32",
          container: this.options.container,
          containerCollection: this.collection,
          inlineBarStyle: "csui-table-actionbar-bubble",
          forceInlineBarOnClick: false,
          showInlineBarOnHover: true,
          toolItemsMask: this.options.toolbarItemsMasks.toolbars.tableInlineActionbar
        })
      }
    }, this.options, this.#getPaginationOptions());
    this.tableView = new TableView(args);
  }
  _setToolbarView() {
    this.toolbarView = new TableToolbarView({
      originatingView: this,
      blockingParentView: this,
      removeContainer: true,
      context: this.context,
      commands: this.commands,
      toolbarItems: this.options.toolbarItems,
      toolbarItemsMasks: this.options.toolbarItemsMasks,
      collection: this.collection
    });
  }
  #getPaginationOptions() {
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
    const po = this.#getPaginationOptions();
    this.paginationView = new PaginationView({
      collection: this.collection,
      pageSize: po.pageSize,
      defaultDDList: po.ddItemsList,
      skipPaginationUpdateRequest: true,
      blockingParentView: this
    });
  }
  onBeforeDestroy() {
    const resizeTableViewEventName = this._getQulaifiedNameForEvents("resize", "tableview");
    $(window).off(resizeTableViewEventName);
    this.tableView && this.tableView.destroy();
    this.paginationView && this.paginationView.destroy();
    this.toolbarView && this.toolbarView.destroy();
  }
  checkAndDisableAddButton() {
    const isEnabled = this.configModel.get("is_enabled") === true, addButtonSelector = ".csui-addToolbar [data-csui-command=aviator-addassignment]";
    if (isEnabled) {
      $(addButtonSelector).removeClass("disable-add-button");
      $(addButtonSelector + " > a").prop("tabindex", "0");
    }
    this.paginationView.skipCollectionRequest = false;
  }
}

Object.assign(AssignmentsTableView.prototype, LayoutViewEventsPropagationMixin);

Object.defineProperty(AssignmentsTableView.prototype.constructor, "name", {
  value: "AssignmentsTableView"
});

export default AssignmentsTableView;