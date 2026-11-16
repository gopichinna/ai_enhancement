/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "nuc/models/nodes", "csui/utils/commands", "csui/utils/contexts/factories/connector", "d2/controls/button.toolbar/button.toolbar.view", "d2/models/workflow/task", "d2/models/workflow/task.notes", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/models/workflow/workflow", "d2/utils/constants", "d2/widgets/task.details/impl/task.notes/expanded.task.note.view", "d2/widgets/task.details/impl/task.notes/task.note.header.view", "d2/widgets/task.details/impl/task.notes/task.notes.list.view", "hbs!d2/widgets/task.details/impl/task.notes/task.notes", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.notes/task.notes", "css!d2/widgets/task.details/impl/task.notes/task.expanded.note" ], function(_, $, Backbone, Marionette, BlockingView, NodeCollection, commands, ConnectorFactory, ButtonToolbarView, TaskModel, TaskNoteCollection, WorkflowAuditTask, WorkflowAuditTaskEvent, WorkflowModel, constants, ExpandedTaskNoteView, TaskNoteHeaderView, TaskNotesListView, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-task-notes",
    template: template,
    regions: {
      toolbarRegion: ".d2-toolbar-task-notes",
      notesRegion: ".d2-task-notes-container",
      expandedNoteRegion: ".d2-task-expanded-note-region",
      expandedNoteHeaderContainer: ".d2-task-expanded-note-header-container"
    },
    ui: {
      expandedNoteHeaderContainer: ".d2-task-expanded-note-header-container"
    },
    constructor: function TaskNotesView(options) {
      options = options || {};
      this.options = options;
      this.additionalPanelsView = options.additionalPanelsView;
      this.node = options.node;
      this.context = options.context;
      this.filterBy = this.node instanceof WorkflowAuditTask || this.node instanceof WorkflowAuditTaskEvent ? "task" : undefined;
      this.collection = options.collection || new TaskNoteCollection(undefined, {
        connector: this.context.getObject(ConnectorFactory),
        taskModel: this.node,
        autoreset: true,
        filterBy: this.filterBy
      });
      this.collection.setLimit(0, 10, false);
      this.collection.fetch();
      this._setupChildViews();
      this._checkAddNoteEnabled();
      Marionette.LayoutView.prototype.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this, "d2:expanded:task:note", _.bind(this._showExpandedTaskNote, this));
      this.listenTo(this.node, "change:wf_notes_count", _.bind(this._refreshTab, this));
      this.listenTo(this.collection, "reset", _.bind(this._onCollectionReset, this));
      this.listenTo(this.additionalPanelsView, "activate:tab", _.bind(this._resetScroll, this));
    },
    _onCollectionReset: function() {
      this.node.set("wf_notes_count", this.collection.totalCount);
    },
    _checkAddNoteEnabled: function() {
      var addNoteCommand = this.node instanceof TaskModel ? commands.get("D2-AddTaskNote") : this.node instanceof WorkflowModel ? commands.get("D2-AddWorkflowNote") : null;
      this.addNoteEnabled = addNoteCommand && addNoteCommand.enabled({
        nodes: new NodeCollection([ this.node ])
      });
    },
    _resetScroll: function(tabContent, tabPane) {
      if (tabPane.content === this) {
        this.notesListView.ui.notesContainer.scrollTop && this.notesListView.ui.notesContainer.scrollTop(0);
        this.notesListView.trigger("highlight", false);
        this.notesListView._loadMoreItemsAvailableIfNoScroll();
      }
    },
    _refreshTab: function() {
      this._updateHeaderTitle(this.node.get("wf_notes_count"));
    },
    _setupChildViews: function() {
      this._setupToolbarView();
      this._setupNotesListView();
    },
    _setupToolbarView: function() {
      var buttonsConfig = {
        left: [ {
          id: "addTaskNote",
          className: "icon icon-add-task-note",
          iconName: "csui_action_add32",
          tooltip: lang.labelToolbarAddNote,
          clickHandler: this._onAddTaskNoteClick.bind(this)
        }, {
          id: "backToNotesList",
          className: "icon icon-back-task-notes binf-hidden",
          iconName: "csui_action_back32",
          tooltip: lang.labelToolbarBackToNoteList,
          clickHandler: this._onBackToNotesListClick.bind(this)
        } ]
      };
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
    },
    _setupNotesListView: function() {
      this.notesListView = new TaskNotesListView({
        collection: this.collection,
        context: this.context,
        taskNotesView: this
      });
    },
    onRender: function() {
      this._showChildViews();
    },
    onBeforeDestroy: function() {
      this.notesListView.destroy();
    },
    _showChildViews: function() {
      this._showToolbarView();
      this._showNotesListView();
    },
    _showToolbarView: function() {
      this.toolbarView && this.toolbarRegion.show(this.toolbarView);
      !this.addNoteEnabled && this.toolbarRegion.$el.addClass("binf-hidden");
    },
    _showNotesListView: function() {
      var me = this;
      me.blockActions();
      me.collection.ensureFetched().always(function() {
        me.notesRegion.show(me.notesListView);
        me._updateHeaderTitle(me.collection.totalCount);
        me.unblockActions();
      });
      me.expandedNoteRegion.$el.addClass("binf-hidden");
    },
    _updateHeaderTitle: function(length) {
      if (this.additionalPanelsView) {
        if (length) {
          this.additionalPanelsView.trigger("update:tab:header", this.model, _.str.sformat(lang.titleAdditionalPanelNotes, length));
        } else {
          this.additionalPanelsView.trigger("update:tab:header", this.model, lang.defaultTitleAdditionalPanelNotes);
        }
      }
    },
    _onAddTaskNoteClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      var me = this, addNoteCommand = this.node instanceof TaskModel ? commands.get("D2-AddTaskNote") : this.node instanceof WorkflowModel ? commands.get("D2-AddWorkflowNote") : null;
      if (addNoteCommand) {
        addNoteCommand.execute({
          nodes: new NodeCollection([ this.node ]),
          noteCollection: me.collection
        });
        setTimeout(function() {
          me.notesListView.trigger("highlight", false);
        }, 300);
      }
    },
    _showExpandedTaskNote: function(options) {
      !this.addNoteEnabled && this.toolbarRegion.$el.removeClass("binf-hidden");
      this.$el.find(".icon-back-task-notes").removeClass("binf-hidden");
      this.$el.find(".icon-add-task-note").addClass("binf-hidden");
      this.toolbarView.$el.addClass("expanded-note-toolbar");
      this.toolbarView.$el.append(this.ui.expandedNoteHeaderContainer);
      if (this.ui.expandedNoteHeaderContainer.removeClass) {
        this.ui.expandedNoteHeaderContainer.removeClass("binf-hidden");
      }
      options = _.extend(options, {
        notesView: this,
        showFocused: options.showFocused,
        originatingNoteIndex: options.originatingNoteIndex
      });
      this.noteHeaderView = new TaskNoteHeaderView({
        context: this.context,
        noteDate: options.noteDate,
        noteDateTitle: options.noteDateTitle,
        noteAuthor: options.noteAuthor,
        setTabIndex: true
      });
      this.expandedNoteHeaderContainer.show(this.noteHeaderView);
      this.setupExpandedNoteView(options);
      this.expandedNoteRegion.show(this.expandedTaskNoteView);
      this.expandedNoteRegion.$el.removeClass("binf-hidden");
      this.notesRegion.$el.addClass("binf-hidden");
      this.notesListView.trigger("highlight", false);
      this.$el.addClass("d2-task-note-expanded");
      options.showFocused && this.expandedTaskNoteView.ui.expandedNoteContent.trigger("focus");
    },
    setupExpandedNoteView: function(options) {
      this.expandedTaskNoteView = new ExpandedTaskNoteView(options);
    },
    _onBackToNotesListClick: function(e, options) {
      e.stopPropagation();
      e.preventDefault();
      this.$el.find(".icon-back-task-notes").addClass("binf-hidden");
      this.$el.find(".icon-add-task-note").removeClass("binf-hidden");
      this.ui.expandedNoteHeaderContainer.addClass("binf-hidden");
      this.toolbarView.$el.removeClass("expanded-note-toolbar");
      this.toolbarView.$el.detach(this.ui.expandedNoteHeaderContainer);
      !this.addNoteEnabled && this.toolbarRegion.$el.addClass("binf-hidden");
      this.$el.find(".d2-task-notes-container").removeClass("binf-hidden");
      this.expandedNoteRegion.$el.addClass("binf-hidden");
      this.$el.removeClass("d2-task-note-expanded");
      if (options && options.showFocused && this.notesListView.selectedIndex !== options.originatingNoteIndex) {
        var previousSelected = this.notesListView.getElementByIndex(this.notesListView.selectedIndex), newSelected = this.notesListView.getElementByIndex(options.originatingNoteIndex);
        previousSelected.prop("tabindex", "-1");
        newSelected.prop("tabindex", "0");
        newSelected.trigger("focus");
        this.notesListView.selectedIndex = options.originatingNoteIndex;
      } else if (options && options.showFocused) {
        this.notesListView.getElementByIndex(options.originatingNoteIndex).trigger("focus");
      }
      this.notesListView._loadMoreItemsAvailableIfNoScroll();
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node && (options.node.get("type") === constants.Types.TASK || options.node.get("type") === constants.Types.WORKFLOW) && !options.node.get("wf_sv_disable_notes");
    }
  });
});