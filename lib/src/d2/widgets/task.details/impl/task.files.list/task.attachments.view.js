/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "nuc/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/connector", "csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view", "d2/controls/button.toolbar/button.toolbar.view", "d2/models/workflow/task.files", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "dctmw/utils/rest.resources", "nuc/models/node/node.model", "d2/widgets/task.details/impl/task.files.list/task.files.list.view", "d2/widgets/task.details/impl/task.files.list/task.files.list.table/task.attachments.table.view", "d2/widgets/task.details/impl/task.files.list/task.attachments.tabletree/task.attachments.table.tree.view", "csui/controls/tableactionbar/tableactionbar.view", "dctmw/utils/client.location", "hbs!d2/widgets/task.details/impl/task.files.list/task.attachments", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.files.list/task.attachments" ], function(_, $, Marionette, BlockingView, NodeCollection, commands, ConnectionFactory, TableRowSelectionToolbar, ButtonToolbarView, TaskAttachmentsCollection, constants, widgetConstants, ServerQueryUtils, RestResources, NodeModel, FilesListView, TaskAttachmentsTableView, TaskAttachmentsTableTreeView, TableActionBarView, clientLocation, template, csuiLang, lang) {
  "use strict";
  var TaskAttachmentsView = Marionette.LayoutView.extend({
    className: "d2-task-attachments",
    template: template,
    regions: {
      toolbarRegion: ".d2-toolbar-task-attachments",
      filesListRegion: ".d2-task-attachments-container"
    },
    constructor: function TaskAttachmentsView(options = {}) {
      this.additionalPanelsView = options.additionalPanelsView;
      this.node = options.node;
      this.context = options.context;
      this.options = options;
      this.setToolbarAndCollection(options);
      this._checkManageAttachment();
      this._setupChildViews();
      this.setViewType();
      Marionette.LayoutView.prototype.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      const packages = this.options.node.get("packages");
      this.isMultipackage = packages && packages.length > 1 ? true : false;
      this.evtIdInlineMenuCreate = "mouseenter.inline_menu_" + this.cid;
      this.evtIdInlineMenuDestroy = "mouseleave.inline_menu_" + this.cid;
      this.evtIdInlinePacakageMenuCreate = "mouseenter.inline_package_menu_" + this.cid;
      this.evtIdInlinePackageMenuDestroy = "mouseleave.inline_package_menu_" + this.cid;
      this.listenTo(this.collection, "reset", _.bind(this._onCollectionReset, this));
      this.listenTo(this.collection, "d2:task:attachments:added", _.bind(this._highlightNewAttachments, this));
      this.listenTo(this.collection, "d2:task:attachments:removed", _.bind(this._removeAttachments, this));
      this.listenTo(this.collection, "d2:task:workingfiles:removed", _.bind(this._refresh, this));
      this.listenTo(this.collection, "d2:task:workingfiles:added", _.bind(this._refresh, this));
      this.listenTo(this.collection, "d2:task:package:mapped", _.bind(this._updateCount, this));
      this.listenTo(this.collection, "d2:task:package:unmapped", _.bind(this._updateCount, this));
    },
    onCheckbox: function(selectedNodes) {
      if (selectedNodes.length > 0) {
        this.setTableRowSelectionToolbar({
          toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
          toolbarItemsMask: this.options.toolbarItemsMasks.tableHeaderToolbar,
          showCondensedHeaderToggle: false,
          showSelectionCounter: false
        });
        this.listenTo(this.toolbarView._commandController, "before:execute:command", this._includeAdditionalCommandStatusParams.bind(this));
        this.listenTo(this.toolbarView._commandController, "after:execute:command", eventArgs => this.clearAllSelectedNodesSelection(eventArgs));
        this.toolbarViewOnCheckbox = this.toolbarView;
        this.toolbarRegion.show(this.toolbarView);
      } else {
        if (this.toolbarViewOnCheckbox) {
          this._setupToolbarView();
          this.toolbarRegion.show(this.toolbarView);
        }
      }
    },
    getAllSelectedNodes: function() {
      return this.filesListView.selectedNodes;
    },
    setTableRowSelectionToolbar: function(options) {
      this.toolbarView = new TableRowSelectionToolbar({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        showCondensedHeaderToggle: options.showCondensedHeaderToggle,
        showSelectionCounter: options.showSelectionCounter,
        collection: this.collection,
        container: this.node,
        originatingView: this,
        selectedChildren: this.getAllSelectedNodes()
      });
    },
    clearAllSelectedNodesSelection(eventArgs) {
      if (eventArgs.command.get("resetToolbar")) {
        this.filesListView.selectedNodes.reset();
        this.onCheckbox(this.filesListView.selectedNodes);
      }
    },
    _includeAdditionalCommandStatusParams: function(eventArgs) {
      const selectedNodeId = [];
      if (this.filesListView && this.filesListView.selectedNodes) {
        _.each(this.filesListView.selectedNodes.models, selectedModel => {
          selectedNodeId.push(selectedModel.get("id"));
        });
      }
      return _.defaults(eventArgs.status, {
        context: this.context,
        task: this.node,
        workflow: this.node,
        selectedNodeId: selectedNodeId,
        selectedFileTab: this.model.get("name"),
        selectedMetaTab: ""
      });
    },
    setToolbarAndCollection: function(options) {
      this.toolbarItems = {
        inlineActionbar: options.toolbarItems.inlineActionbar
      };
      this.toolbarItemsMasks = {
        toolbars: {
          inlineActionbar: options.toolbarItemsMasks.toolbars.inlineActionbar
        }
      };
      this.collection = options.collection || new TaskAttachmentsCollection(undefined, {
        node: this.node,
        autoreset: true,
        fetchRelationsCount: true,
        delayRestCommands: true,
        promoteSomeRestCommands: true,
        commands: commands.getSignatures(this.toolbarItems),
        toolbarItems: options.toolbarItems && options.toolbarItems.inlineActionbar
      });
      this.collection.widgetPreference = this._getColumnPreferenceOptions();
      this.collection.setLimit(0, 15, false);
    },
    _onCollectionReset: function() {
      if (this._isWorkingFilesView()) {
        this._updatePackages();
        var wf = this.collection.filter(function(node) {
          return node.get("name");
        });
        this.updateCountAttribute(wf.length);
      } else {
        this.updateCountAttribute(this.collection.totalCount);
      }
    },
    _updateCount: function() {
      if (this._isWorkingFilesView()) {
        var wf = this.collection.filter(function(node) {
          return node.get("name");
        });
        if (wf && wf.length) {
          this.updateCountAttribute(wf.length);
        }
      }
    },
    _isWorkingFilesView: function() {
      var isWorkingFileView = false;
      if (this.additionalPanelsView && this.additionalPanelsView.activeTabContent) {
        if (this.additionalPanelsView.activeTabContent.model.get("name") === "working") {
          isWorkingFileView = true;
        }
      }
      return isWorkingFileView;
    },
    _updatePackages: function() {
      var packages = this.options.node.get("packages");
      var isMultipackage = packages && packages.length > 1 ? true : false;
      if (packages && packages.length) {
        var packageNames = packages.map(pkg => pkg.name);
        var collectionPackageNames = this.collection.pluck("package");
        var missingPackages = _.filter(packageNames, function(packageName) {
          return !_.includes(collectionPackageNames, packageName);
        });
        this.collection.each(function(model) {
          var pcks = packages.filter(function(pck) {
            return pck.name === model.get("package");
          });
          model.set("package-obj", pcks[0]);
        });
        if (isMultipackage && (this.options.workflowModel && ![ "aborted", "finished" ].includes(this.options.workflowModel?.get("d2_workflow_state")))) {
          var pckNodesArr = [];
          var highlightNode;
          for (var i = 0; i < missingPackages.length; i++) {
            var pck = packages.filter(function(pck) {
              return pck.name === missingPackages[i];
            });
            var pcknode = new NodeModel({
              connector: this.options.node.connector
            });
            pcknode.set("isEmptyPackage", true);
            pcknode.set("package", pck[0]?.name);
            pcknode.set("package-obj", pck[0]);
            pckNodesArr.push(pcknode);
            if (missingPackages[i] === this.pckname) {
              highlightNode = pcknode;
            }
          }
          this.collection.add(pckNodesArr);
          this.pckname = "";
          if (highlightNode) {
            highlightNode.set("highlight", true);
          }
        }
      }
    },
    updateCountAttribute: function() {},
    getAttachmentsCount: function() {},
    _highlightNewAttachments: function(models) {
      var newCount = 0;
      _.each(models, function(model) {
        model.trigger("highlight", true);
        newCount++;
      });
      newCount && (this.collection._lastFilterAndSortCriteria = {});
      if (this.filesListView) {
        if (this.filesListView.selectedIndex >= 0) {
          this.filesListView.selectedIndex += newCount;
          this.filesListView.getElementByIndex(this.filesListView.selectedIndex) && this.filesListView.getElementByIndex(this.filesListView.selectedIndex).prop("tabindex", "0");
        } else {
          this.filesListView.getElementByIndex(0) && this.filesListView.getElementByIndex(0).prop("tabindex", "0");
        }
      }
      if (this.options.isTaskDetailsWithContent) {
        if (!this.filesTableTreeView) {
          this._setupFilesTableTreeView();
          this._showFilesTableTreeView();
        } else {
          this.filesTableTreeView.tree.reload();
        }
      }
    },
    _refresh: function(data) {
      if (data) {
        this.pckname = data.pckname;
      }
      var me = this;
      this.collection.fetch({
        reload: true
      }).always(function() {
        var updatedmodel = me.collection.filter(function(model) {
          return model.get("package") === data.pckname;
        });
        if (updatedmodel && updatedmodel[0]) {
          me._highlightNewAttachments([ updatedmodel[0] ]);
        }
      });
    },
    _removeAttachments: function(deletedNodes) {
      _.each(deletedNodes, function(deletedNode) {
        var matchModel = _.find(this.collection.allModels, function(model) {
          return model.get("id") === deletedNode.get("id");
        });
        matchModel && (deletedNode = matchModel);
        if (_.contains(this.collection.models, deletedNode)) {
          this.collection.remove(deletedNode);
        }
        if (_.contains(this.collection.allModels, deletedNode)) {
          this.collection.allModels.splice(this.collection.allModels.indexOf(deletedNode), 1);
          this.collection.totalCount--;
        }
        if (_.contains(this.collection.lastFilteredAndSortedModels, deletedNode)) {
          this.collection.lastFilteredAndSortedModels.splice(this.collection.lastFilteredAndSortedModels.indexOf(deletedNode), 1);
          this.collection.filteredCount--;
        }
      }, this);
      this._adjustSelectionAfterAttachmentsRemove();
      this.updateCountAttribute(this.collection.totalCount);
    },
    _adjustSelectionAfterAttachmentsRemove: function() {
      if (this.filesListView) {
        this.filesListView.getElementByIndex(this.filesListView.selectedIndex) && this.filesListView.getElementByIndex(this.filesListView.selectedIndex).prop("tabindex", "-1");
        this.filesListView.selectedIndex >= 0 && (this.filesListView.selectedIndex = -1);
        this.filesListView.getElementByIndex(0) && this.filesListView.getElementByIndex(0).prop("tabindex", "0");
      }
      if (this.filesTableTreeView) {
        this.filesTableTreeView.tree.reload();
      }
    },
    _refreshTab: function() {
      this._updateHeaderTitle(this.getAttachmentsCount());
      this._updateToolbar();
      this.$el.find(".tile-content").trigger("scroll");
    },
    _checkManageAttachment: function() {
      var manageAttachmentCommand = commands.get("D2-WorkflowManageAttachment");
      this.manageAttachmentEnabled = manageAttachmentCommand && manageAttachmentCommand.enabled({
        nodes: new NodeCollection([ this.node ])
      });
    },
    _setupChildViews: function() {
      this._setupToolbarView();
      const attachmentsCount = this.getAttachmentsCount();
      if (this.options.isTaskDetailsWithContent && attachmentsCount > 0) {
        this._setupFilesTableTreeView();
      } else {
        this.collection.setLimit(0, 15, false);
        this._setupFilesListView();
      }
    },
    _setupToolbarView: function() {
      var buttonsConfig = {
        left: [],
        right: [ {
          id: "showAttachmentDetails",
          className: "icon icon-show-attachments-details",
          iconName: "d2_action_panel_open",
          tooltip: lang.labelToolbarShowDetails,
          clickHandler: this._onShowAttachmentsDetailsClick.bind(this)
        } ]
      };
      if (this.manageAttachmentEnabled) {
        buttonsConfig.left.push({
          id: "addAttachment",
          iconName: "csui_action_add32",
          tooltip: lang.labelToolbarAddFiles,
          clickHandler: this._onAddAttachmentsClick.bind(this)
        });
      }
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
    },
    _updateToolbar: function() {
      if (!(this.collection.length || this.manageAttachmentEnabled || this.toolbarRegion.$el.hasClass("binf-hidden"))) {
        return this.toolbarRegion.$el.addClass("binf-hidden");
      }
      if (this.collection.length && this.toolbarRegion.$el.hasClass("binf-hidden")) {
        return this.toolbarRegion.$el.removeClass("binf-hidden");
      }
      if (this.manageAttachmentEnabled && this.toolbarRegion.$el.hasClass("binf-hidden")) {
        this.toolbarRegion.$el.removeClass("binf-hidden");
      }
      if (!this.collection.length) {
        this.$el.find(".icon-show-attachments-details").addClass("binf-hidden");
      } else {
        this.$el.find(".icon-show-attachments-details").removeClass("binf-hidden");
      }
    },
    _setupFilesListView: function() {
      this.filesListView = new FilesListView({
        collection: this.collection,
        additionalPanelsView: this.additionalPanelsView,
        originatingView: this,
        context: this.context,
        toolbarItems: this.toolbarItems,
        toolbarItemsMasks: this.toolbarItemsMasks,
        isTaskDetailsWithContent: this.options.isTaskDetailsWithContent || false
      });
      this.listenTo(this.filesListView, "selectedNodes", this._selectedNodes);
    },
    _setupFilesTableTreeView: function() {
      this.filesTableTreeView = new TaskAttachmentsTableTreeView(this);
    },
    _createTableActionBarView: function(e) {
      if (clientLocation.getHashParams()?.type === "working" || clientLocation.getHashParams()?.type === "supporting") return;
      const $tableActionBarView = $(e.currentTarget).find(".d2-inline-row-action"), nodeKey = $tableActionBarView.data("key");
      if (!!nodeKey && !this.tableActionBarView) {
        let nodeModel = this.filesTableTreeView.tree.getNodeByKey(nodeKey).data.origNode;
        let rgnMenuBar = new Marionette.Region({
          el: $tableActionBarView
        });
        this.tableActionBarView = new TableActionBarView(_.extend({}, this.toolbarItemsOptions, {
          context: this.options.context,
          originatingView: this,
          commands: commands,
          model: nodeModel,
          collection: this.toolbarItems.inlineActionbar,
          containerCollection: this.model.collection,
          status: {
            originatingView: this
          },
          inlineBarStyle: "csui-table-actionbar-bubble",
          toolItemsMask: this.toolbarItemsMasks.toolbars.inlineActionbar,
          addGroupSeparators: true,
          maxItemsShown: 4,
          dropDownIconName: "csui_action_more32",
          dropDownText: csuiLang.ToolbarItemMore,
          lazyActions: true
        }));
        this.tableActionBarView.on("before:execute:command", this._onBeforeExecuteCommand.bind(this));
        this.tableActionBarView.on("after:execute:command", this._onAfterExecuteCommand.bind(this));
        rgnMenuBar.show(this.tableActionBarView);
      }
    },
    _createPackageButtonToolBarView: function(e) {
      const $packageButtonToolBarView = $(e.currentTarget).find(".d2-inline-package-row-action");
      const packageKey = $packageButtonToolBarView.data("key");
      if (!!packageKey && !this.packageButtonToolBarView && $packageButtonToolBarView.length != 0) {
        let packageNode = this.filesTableTreeView.tree.getNodeByKey(packageKey).data.origNode;
        let rgnPackageMenuBar = new Marionette.Region({
          el: $packageButtonToolBarView
        });
        var buttonsConfig = {
          right: [ {
            id: "addAttachment",
            className: "icon icon-task-add-attachments",
            tooltip: this.addButtonTooltip,
            clickHandler: this._onTableTreeAddPackageAttachmentsClick.bind(this, packageNode)
          } ]
        };
        this.packageButtonToolBarView = new ButtonToolbarView(buttonsConfig);
        rgnPackageMenuBar.show(this.packageButtonToolBarView);
      }
    },
    _onBeforeExecuteCommand: function(eventArgs) {
      this.beforeExecuteNodes = eventArgs && eventArgs.status && eventArgs.status.nodes;
      this._includeAdditionalCommandStatusParams(eventArgs);
    },
    _onAfterExecuteCommand: function(eventArgs) {
      if (eventArgs && eventArgs.status && eventArgs.status.nodes && eventArgs.status.nodes.length && eventArgs.commandSignature !== "UnreserveDoc") {
        var nodes = this.beforeExecuteNodes && this.beforeExecuteNodes.length ? this.beforeExecuteNodes.models : eventArgs.status.nodes.models, refreshNodeIds = _.map(nodes, function(node) {
          return node.get("id");
        });
        this.beforeExecuteNodes = undefined;
        this.options.originatingView && this.options.originatingView.additionalPanelsView && this.options.originatingView.additionalPanelsView.trigger("d2:refresh:task:attachment", this.options.filesListView, refreshNodeIds);
      }
    },
    _destroyTableActionBarView: function() {
      if (this.tableActionBarView) {
        this.tableActionBarView.destroy();
        this.tableActionBarView = null;
      }
    },
    _destroyPackageButtonToolBarView: function() {
      if (this.packageButtonToolBarView) {
        this.packageButtonToolBarView.destroy();
        this.packageButtonToolBarView = null;
      }
    },
    _selectedNodes: function() {
      this.onCheckbox(this.filesListView.selectedNodes.models);
    },
    onRender: function() {
      this._showChildViews();
    },
    onBeforeDestroy: function() {
      if (this.filesListView) {
        this.filesListView.destroy();
      }
      if (this.filesTableTreeView) {
        this.filesTableTreeView.destroy();
      }
    },
    _showChildViews: function() {
      this.toolbarView && this.toolbarRegion.show(this.toolbarView);
      const attachmentsCount = this.getAttachmentsCount();
      if (this.options.isTaskDetailsWithContent && attachmentsCount > 0) {
        this._showFilesTableTreeView();
      } else {
        this._showFilesListView();
      }
    },
    _showFilesTableTreeView: function() {
      var me = this;
      me.blockActions();
      me.collection.ensureFetched().always(function() {
        me.filesListRegion.show(me.filesTableTreeView);
        me.filesTableTreeView.$el.off(me.evtIdInlineMenuCreate).on(me.evtIdInlineMenuCreate, "tr", _.throttle(me._createTableActionBarView.bind(me), 300));
        me.filesTableTreeView.$el.off(me.evtIdInlineMenuDestroy).on(me.evtIdInlineMenuDestroy, "tr", me._destroyTableActionBarView.bind(me));
        if (me.isMultipackage) {
          me.filesTableTreeView.$el.off(me.evtIdInlinePacakageMenuCreate).on(me.evtIdInlinePacakageMenuCreate, "tr", _.throttle(me._createPackageButtonToolBarView.bind(me), 300));
          me.filesTableTreeView.$el.off(me.evtIdInlinePackageMenuDestroy).on(me.evtIdInlinePackageMenuDestroy, "tr", me._destroyPackageButtonToolBarView.bind(me));
        }
        me._updateHeaderTitle(me.collection.totalCount);
        me._updateToolbar();
        me.unblockActions();
      });
    },
    _showFilesListView: function() {
      var me = this;
      me.filesListRegion.show(me.filesListView);
      me.blockActions();
      me.collection.ensureFetched().always(function() {
        me._updateHeaderTitle(me.collection.totalCount);
        me._updateToolbar();
        me.unblockActions();
      });
    },
    _updateHeaderTitle: function(length) {
      if (this.additionalPanelsView) {
        if (length) {
          this.additionalPanelsView.trigger("update:tab:header", this.model, _.str.sformat(lang.titleAdditionalPanelAttachments, length));
        } else {
          this.additionalPanelsView.trigger("update:tab:header", this.model, lang.defaultTitleAdditionalPanelAttachments);
        }
      }
    },
    _onAddAttachmentsClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      var addAttachmentCommand = commands.get("D2-WorkflowAddAttachment");
      addAttachmentCommand && addAttachmentCommand.execute({
        context: this.context,
        nodes: new NodeCollection([ this.node ]),
        originatingView: this,
        collection: this.collection
      });
      setTimeout(_.bind(function() {
        this.trigger("highlight", false);
        this.collection.fetch({
          reset: false
        });
      }, this), 1e3);
    },
    _onTableTreeAddPackageAttachmentsClick: function(origNode, e) {
      e.stopPropagation();
      e.preventDefault();
      var addWorkingFileCommand = commands.get("D2-TaskAddWorkingFile");
      addWorkingFileCommand && addWorkingFileCommand.execute({
        context: this.context,
        node: origNode,
        taskModel: this.options.node,
        originatingView: this,
        collection: this.collection
      });
    },
    _onShowAttachmentsDetailsClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      this.context.viewStateModel.attributes.state.filter = {};
      var columnPreferenceOptions = this._getColumnPreferenceOptions();
      ServerQueryUtils.fetchColumnPreferences(columnPreferenceOptions).always(() => {
        this.attachmentsExpandedView = this.getExpandedView().show({
          context: this.options.context,
          container: this.node,
          tabModel: this.model,
          attachmentsListView: this,
          toolbarItems: {
            rightToolbar: this.options.toolbarItems.tableRightToolbar,
            inlineActionbar: this.options.toolbarItems.tableInlineActionBar,
            tableHeaderToolbar: this.options.toolbarItems.tableHeaderToolbar
          },
          toolbarItemsMasks: {
            toolbars: {
              rightToolbar: this.options.toolbarItemsMasks.toolbars.rightToolbar,
              inlineActionbar: this.options.toolbarItemsMasks.toolbars.inlineActionbar,
              tableHeaderToolbar: this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar
            }
          }
        });
        this.attachmentsExpandedView.once("destroy", function() {
          delete this.attachmentsExpandedView;
        }.bind(this));
        setTimeout(_.bind(function() {
          this.trigger("highlight", false);
          this.collection.fetch({
            reset: false
          });
        }, this), 350);
        this.trigger("task:attachments:view:shown");
      });
    },
    _getColumnPreferenceOptions: function() {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), widgetName = userDefaultWidgets[widgetConstants.DEFAULT.TASK_ATTACHMENTS], connectionObject = this.context.getObject(ConnectionFactory);
      return {
        widgetName: widgetName,
        widgetType: widgetConstants.D2.TASK_ATTACHMENTS,
        defaultType: constants.ColTypes.DEFAULT,
        connector: connectionObject
      };
    },
    getExpandedView: function() {
      return TaskAttachmentsTableView;
    }
  }, {
    enabled: function() {
      return false;
    }
  });
  return TaskAttachmentsView;
});