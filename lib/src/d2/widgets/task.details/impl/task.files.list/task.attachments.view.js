/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "nuc/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/connector", "csui/controls/tabletoolbar/tabletoolbar.view", "d2/controls/button.toolbar/button.toolbar.view", "d2/models/workflow/task.files", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "dctmw/utils/rest.resources", "d2/widgets/task.details/impl/task.files.list/task.files.list.view", "d2/widgets/task.details/impl/task.files.list/task.files.list.table/task.attachments.table.view", "hbs!d2/widgets/task.details/impl/task.files.list/task.attachments", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.files.list/task.attachments" ], function(_, $, Marionette, BlockingView, NodeCollection, commands, ConnectionFactory, TableToolbarView, ButtonToolbarView, TaskAttachmentsCollection, constants, widgetConstants, ServerQueryUtils, RestResources, FilesListView, TaskAttachmentsTableView, template, lang) {
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
      this.setToolbarAndCollection(options);
      this._checkManageAttachment();
      this._setupChildViews();
      Marionette.LayoutView.prototype.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "reset", _.bind(this._onCollectionReset, this));
      this.listenTo(this.collection, "d2:task:attachments:added", _.bind(this._highlightNewAttachments, this));
      this.listenTo(this.collection, "d2:task:attachments:removed", _.bind(this._removeAttachments, this));
    },
    onCheckbox: function(selectedNodes) {
      const toolbarItems = this.options.toolbarItems;
      var args = _.extend({
        toolbarItems: toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        selectedNodes: this.filesListView.selectedNodes,
        collection: this.collection,
        model: this.options.model,
        originatingView: this.options.originatingView,
        context: this.context
      });
      if (selectedNodes.length > 0) {
        this.toolbarView = new TableToolbarView(_.extend(args));
        this.listenTo(this.toolbarView.commandController, "before:execute:command", this._includeAdditionalCommandStatusParams.bind(this));
        this.listenTo(this.toolbarView.commandController, "after:execute:command", eventArgs => this.clearAllSelectedNodesSelection(eventArgs));
        this.toolbarViewOnCheckbox = this.toolbarView;
        this.toolbarRegion.show(this.toolbarView);
      } else {
        if (this.toolbarViewOnCheckbox) {
          this._setupToolbarView();
          this.toolbarRegion.show(this.toolbarView);
        }
      }
    },
    clearAllSelectedNodesSelection(eventArgs) {
      if (eventArgs.command.get("resetToolbar")) {
        this.filesListView.selectedNodes.reset();
        this.onCheckbox(this.filesListView.selectedNodes);
      }
    },
    _includeAdditionalCommandStatusParams: function(eventArgs) {
      const selectedNodeId = [];
      _.each(this.filesListView.selectedNodes.models, selectedModel => {
        selectedNodeId.push(selectedModel.get("id"));
      });
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
      this.collection.setLimit(0, 15, false);
    },
    _onCollectionReset: function() {
      this.updateCountAttribute(this.collection.totalCount);
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
      if (this.filesListView.selectedIndex >= 0) {
        this.filesListView.selectedIndex += newCount;
        this.filesListView.getElementByIndex(this.filesListView.selectedIndex) && this.filesListView.getElementByIndex(this.filesListView.selectedIndex).prop("tabindex", "0");
      } else {
        this.filesListView.getElementByIndex(0) && this.filesListView.getElementByIndex(0).prop("tabindex", "0");
      }
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
      this.filesListView.getElementByIndex(this.filesListView.selectedIndex) && this.filesListView.getElementByIndex(this.filesListView.selectedIndex).prop("tabindex", "-1");
      this.filesListView.selectedIndex >= 0 && (this.filesListView.selectedIndex = -1);
      this.filesListView.getElementByIndex(0) && this.filesListView.getElementByIndex(0).prop("tabindex", "0");
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
      this._setupFilesListView();
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
        toolbarItemsMasks: this.toolbarItemsMasks
      });
      this.listenTo(this.filesListView, "selectedNodes", this._selectedNodes);
    },
    _selectedNodes: function() {
      this.onCheckbox(this.filesListView.selectedNodes.models);
      this.toolbarViewOnCheckbox.updateForSelectedChildren([ ...this.filesListView.selectedNodes.models ]);
    },
    onRender: function() {
      this._showChildViews();
    },
    onBeforeDestroy: function() {
      this.filesListView.destroy();
    },
    _showChildViews: function() {
      this.toolbarView && this.toolbarRegion.show(this.toolbarView);
      this._showFilesListView();
    },
    _showFilesListView: function() {
      var me = this;
      me.blockActions();
      me.collection.ensureFetched().always(function() {
        me.filesListRegion.show(me.filesListView);
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