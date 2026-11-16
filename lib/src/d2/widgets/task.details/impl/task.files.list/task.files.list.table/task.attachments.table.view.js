/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/controls/dialog/nonoverflowing.dialog.view", "d2/widgets/widgettable/widgettable.view", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "csui/utils/commands", "d2/utils/widget.constants", "d2/utils/constants", "dctmw/utils/authenticators/session", "dctmw/utils/rest.resources", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.files.list/task.files.list.table/task.attachments.table" ], function(_, $, Backbone, Marionette, NonOverflowingDialogView, D2WidgetTable, toolbarItems, toolbarItemsMasks, commands, widgetConstants, constants, Session, RestResources, lang) {
  "use strict";
  var TaskAttachmentsTableView = D2WidgetTable.extend({
    className: function() {
      var zuper = TaskAttachmentsTableView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-task-attachments-table";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    constructor: function TaskAttachmentsTableView() {
      D2WidgetTable.prototype.constructor.apply(this, arguments);
      var me = this, oldShowInlineBar = this.tableView._showInlineBar;
      this.tableView._showInlineBar = function(args) {
        oldShowInlineBar.call(this, args);
        this.inlineBarView && this.inlineBarView.on("before:execute:command", _.bind(me._beforeExecuteInlineCommand, me));
        this.inlineBarView && this.inlineBarView.on("after:execute:command", _.bind(me._afterExecuteInlineCommand, me));
      };
      this.listenTo(this.collection, "d2:task:attachments:removed", _.bind(this._removeAttachments, this));
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.TASKATTACHMENTS;
    },
    getTitle: function() {
      return lang.defaultTitleAdditionalPanelAttachments;
    },
    getCollectionOptions: function() {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), widgetName = userDefaultWidgets[widgetConstants.DEFAULT.TASK_ATTACHMENTS];
      return {
        node: this.options.container,
        widgetName: widgetName,
        commands: commands.getSignatures({
          inlineActionbar: this.options.toolbarItems.inlineActionbar
        }),
        toolbarItems: this.options.toolbarItems.inlineActionbar
      };
    },
    _beforeExecuteCommand: function(eventArgs) {
      D2WidgetTable.prototype._beforeExecuteCommand.call(this, eventArgs);
      if (eventArgs.commandSignature === "D2-WorkflowRemoveAttachment") {
        this.deletingNodes = true;
        this.tableView.setDeletingNodesState(true);
      }
      this.beforeExecuteNodes = eventArgs && eventArgs.status && eventArgs.status.nodes;
      this._includeAdditionalCommandStatusParams(eventArgs.status);
    },
    _afterExecuteCommand: function(eventArgs) {
      D2WidgetTable.prototype._afterExecuteCommand.call(this, eventArgs);
      if (eventArgs && eventArgs.commandSignature === "D2-WorkflowRemoveAttachment") {
        this.deletingNodes = false;
        this.tableView.setDeletingNodesState(false);
        this.clearAllSelectedNodes();
      }
      this._afterExecuteInlineCommand(eventArgs);
    },
    _beforeExecuteInlineCommand: function(eventArgs) {
      this.beforeExecuteNodes = eventArgs && eventArgs.status && eventArgs.status.nodes;
      this._includeAdditionalCommandStatusParams(eventArgs.status);
    },
    _afterExecuteInlineCommand: function(eventArgs) {
      if (eventArgs && eventArgs.status && eventArgs.status.nodes && eventArgs.status.nodes.length && eventArgs.commandSignature !== "UnreserveDoc") {
        var nodes = this.beforeExecuteNodes && this.beforeExecuteNodes.length ? this.beforeExecuteNodes.models : eventArgs.status.nodes.models, refreshNodeIds = _.map(nodes, function(node) {
          return node.get("id");
        });
        this.beforeExecuteNodes = undefined;
        this.options.attachmentsListView && this.options.attachmentsListView.additionalPanelsView && this.options.attachmentsListView.additionalPanelsView.trigger("d2:refresh:task:attachment", this.options.attachmentsListView, refreshNodeIds);
      }
    },
    _includeAdditionalCommandStatusParams: function(status) {
      return _.defaults(status, {
        context: this.options.context,
        task: this.options.container,
        selectedNodeId: status.nodes && status.nodes.length && status.nodes.map("id") || "",
        selectedFileTab: this.options.tabModel.get("name"),
        selectedMetaTab: "",
        modalDialogContainer: this.$el.closest(".binf-modal.d2-task-attachments-table-dialog")
      });
    },
    _removeAttachments: function(deletedNodes) {
      this.collection.fetch({
        reload: true
      });
      this.options.attachmentsListView && this.options.attachmentsListView.collection && this.options.attachmentsListView.collection.trigger("d2:task:attachments:removed", deletedNodes);
    }
  }, {
    show: function(options) {
      options = options || {};
      var tableViewClass = this;
      var view = new tableViewClass(options);
      view.dialog = new NonOverflowingDialogView({
        className: "d2-task-attachments-table-dialog",
        largeSize: true,
        view: view,
        headerView: new Marionette.ItemView({
          template: false
        })
      });
      view.dialog.once("dialog:shown", function() {
        view.blockActions();
        view.collection.fetch().always(view.unblockActions.bind(view)).fail(function() {
          view.dialog.kill();
        });
      });
      view.listenTo(options.context, "before:change:perspective", function() {
        view.dialog.kill();
        view.destroy();
      });
      view.dialog.listenToOnce(view, "destroy", function() {
        if (view.dialog._isDialogDestroying !== true) {
          view.dialog.kill();
        }
      });
      view.listenTo(Session.get(), "end", () => {
        view.dialog.kill();
        view.destroy();
      });
      view.dialog.show();
      return view;
    }
  });
  return TaskAttachmentsTableView;
});