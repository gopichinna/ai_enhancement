/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "nuc/models/nodes", "csui/utils/commands", "d2/controls/button.toolbar/button.toolbar.view", "d2/widgets/task.details/impl/task.notes/task.note.view", "d2/widgets/workflowstable/impl/workflow.notes/workflow.notes.wizard.view", "d2/utils/format.utils", "hbs!d2/widgets/workflowstable/impl/workflow.notes/workflow.notes.popover", "i18n!d2/widgets/workflowstable/impl/nls/lang", "css!d2/widgets/task.details/impl/task.notes/task.notes", "css!d2/widgets/task.details/impl/task.notes/task.expanded.note", "css!d2/widgets/workflowstable/impl/workflow.notes/workflow.notes.popover" ], function(_, $, Marionette, PerfectScrollingBehavior, NodeCollection, commands, ButtonToolbarView, TaskNoteView, WorkflowNotesWizardView, formatUtils, template, lang) {
  "use strict";
  var stopEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
  };
  var WorkflowNotePopoverView = TaskNoteView.extend({
    events: {
      click: "onClickNote",
      keydown: "onKeyDownNote"
    },
    onKeyDownNote: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickNote(event);
        break;
      }
    },
    onClickNote: function(event) {
      !this.taskNotesListView.options.isTimelineNoteView && this.taskNotesListView._openNoteList(event, this);
    }
  });
  return Marionette.CompositeView.extend({
    className: "d2-workflow-notes-popover",
    template: template,
    ui: {
      notesContainer: ".d2-workflow-notes-popover-container",
      moreBtn: ".more-link",
      toolbar: ".d2-toolbar-workflow-popover-notes"
    },
    events: {
      keydown: "onKeyDownNotesList",
      "mouseleave ": "onMouseLeave",
      focusout: "onFocusOut",
      "click @ui.moreBtn": "_onClickMore",
      "keydown @ui.moreBtn": "_keydownOnMore"
    },
    onMouseLeave: function(event) {
      this.hidePopover(event);
      this.options.cellView.$el.trigger("focus");
    },
    onFocusOut: function(event) {
      setTimeout(function() {
        if (this.$el.has(document.activeElement).length === 0) {
          this.options.cellView.preventToggle = true;
          this.hidePopover(event);
          setTimeout(function() {
            this.options.cellView.preventToggle = false;
          }.bind(this), 301);
        }
      }.bind(this));
    },
    _keydownOnMore: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this._onClickMore(event);
      } else {
        switch (event.which) {
         case 33:
         case 34:
         case 35:
         case 36:
         case 38:
         case 40:
          stopEvent(event);
          break;
        }
      }
    },
    _onClickMore: function(event) {
      this.options.isTimelineNoteView ? this.options.originatingView.trigger("click:more") : this._openNoteList(event);
    },
    templateHelpers: function() {
      return {
        showMore: this.showMore,
        showAddButton: this.showAddButton,
        showMoreLabel: lang.MoreNotesLabel
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-workflow-notes-popover-container",
        suppressScrollX: true
      }
    },
    childViewContainer: ".d2-workflow-notes-popover-container",
    childView: WorkflowNotePopoverView,
    childViewOptions: function(model) {
      var noteDate = formatUtils.formatDueDate(model.get("note_date"), true, true);
      return {
        noteAuthor: model.get("note_by"),
        noteDate: noteDate.display,
        noteDateTitle: noteDate.datetimeInClientFormat,
        noteContent: model.get("note_text"),
        taskNotesListView: this,
        taskNotesView: this.taskNotesView,
        context: this.context
      };
    },
    constructor: function WorkflowNotesPopoverView(options) {
      this.collection = options.collection;
      this.context = options.context;
      this.selectedIndex = 0;
      this.showMore = options.isTimelineNoteView ? true : this.collection.hasMoreRecords;
      var addNoteCommand = commands.get("D2-AddWorkflowNote");
      this.showAddButton = addNoteCommand && addNoteCommand.enabled({
        nodes: new NodeCollection([ options.workflowModel ])
      });
      this.listenTo(this, "d2:workflow:files:scroll", _.bind(this._destroyPopover, this));
      this.listenTo(this, "changed:focus", _.bind(this._destroyPopover, this));
      this._setupToolbarView();
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
    _setupToolbarView: function() {
      var buttonsConfig = {
        left: [ {
          id: "addTaskNote",
          iconName: "csui_action_add32",
          tooltip: lang.AddNoteTooltip,
          clickHandler: this._onAddTaskNoteClick.bind(this)
        } ]
      };
      this.toolbarView = new ButtonToolbarView(buttonsConfig);
    },
    _onAddTaskNoteClick: function(event) {
      stopEvent(event);
      var me = this, addNoteCommand = commands.get("D2-AddWorkflowNote");
      if (addNoteCommand) {
        addNoteCommand.execute({
          nodes: new NodeCollection([ me.options.workflowModel ])
        });
        this._destroyPopover();
      }
    },
    onRender: function() {
      if (this.getElementByIndex(this.selectedIndex)) {
        this.getElementByIndex(this.selectedIndex).prop("tabindex", "0");
        this.getElementByIndex(this.selectedIndex).focus();
      }
      this.toolbarView && (this.toolbarRegion = new Marionette.Region({
        el: this.ui.toolbar
      })) && this.toolbarRegion.show(this.toolbarView);
      !this.showAddButton && this.toolbarRegion.$el.addClass("binf-hidden");
    },
    onKeyDownNotesList: function(event) {
      var previousElement = this.getElementByIndex(this.selectedIndex);
      switch (event.which) {
       case 33:
       case 36:
        this._changeFocus(this.getElementByIndex(0), previousElement, 0);
        stopEvent(event);
        break;

       case 34:
       case 35:
        this._changeFocus(this.getElementByIndex(this.collection.length - 1), previousElement, this.collection.length - 1);
        stopEvent(event);
        break;

       case 40:
        this._changeFocus(this.getElementByIndex(this.selectedIndex + 1), previousElement, this.selectedIndex + 1);
        stopEvent(event);
        break;

       case 38:
        this._changeFocus(this.getElementByIndex(this.selectedIndex - 1), previousElement, this.selectedIndex - 1);
        stopEvent(event);
        break;

       case 9:
        if (event.shiftKey && this.getElementByIndex(this.selectedIndex)[0] === event.target || !event.shiftKey && this.showMore && $(event.target).hasClass("more-link") || !event.shiftKey && !this.showMore && this.getElementByIndex(this.selectedIndex)[0] === event.target) {
          stopEvent(event);
        }
        break;

       case 27:
        stopEvent(event);
        this.options.cellView.$el.trigger("focus");
        this._destroyPopover();
        break;
      }
    },
    getIndexByElement: function(element) {
      if (!element || !element.length) {
        return null;
      }
      var index = null, items = this.$(".d2-workflow-notes-popover-container > .d2-task-note");
      _.find(items, function(item, i) {
        if (item === element[0]) {
          index = i;
        }
      });
      return index;
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0 || index >= this.collection.models.length) {
        return null;
      }
      var items = this.$(".d2-workflow-notes-popover-container > .d2-task-note");
      return $(items[index]);
    },
    _changeFocus: function(nextElement, previousElement, newIndex) {
      if (nextElement && nextElement !== previousElement) {
        nextElement.prop("tabindex", "0");
        previousElement && previousElement.prop("tabindex", "-1");
        nextElement.trigger("focus");
        this.selectedIndex = newIndex;
      }
    },
    _openNoteList: function(event, itemView) {
      this.hidePopover(event);
      var me = this, deferred = $.Deferred();
      if (itemView) {
        me.viewClass = WorkflowNotesWizardView;
        me.viewOptions = {
          showExpanded: true,
          noteAuthor: itemView.model.get("note_by"),
          noteDate: itemView.noteDate,
          noteDateTitle: itemView.noteDateTitle,
          noteContent: itemView.model.get("note_text"),
          originatingNoteIndex: me.getIndexByElement(itemView.$el),
          context: me.options.context,
          node: me.options.workflowModel
        };
      } else {
        me.viewClass = WorkflowNotesWizardView;
        me.viewOptions = {
          context: me.options.context,
          enableAddWorkflowNotes: true,
          node: me.options.workflowModel
        };
      }
      require([ "d2/controls/stepper.wizard/stepper.wizard.view" ], function(StepperWizard) {
        var stepOptions = {
          steps: [ {
            id: "show_note",
            viewClass: me.viewClass,
            viewOptions: me.viewOptions,
            title: lang.ShowNotesWorkflowTitle,
            buttons: [ {
              id: "next",
              hidden: true,
              label: lang.WorkflowSaveNoteLabel,
              clickHandler: function() {
                me.saveNote(this);
              }
            } ],
            onCancel: me.onCancel
          } ],
          className: "d2-workflow-show-note-dialog"
        };
        me.wizard = new StepperWizard(stepOptions);
        me.wizard.show();
        me.wizard.on("wizard:closed", function(cancel) {
          if (cancel) {
            deferred.reject();
          } else {
            deferred.resolve();
          }
        });
      });
      return deferred.promise();
    },
    hidePopover: function(event) {
      stopEvent(event);
      this.firstLoad = false;
      this.$el.parent().parent().binf_popover("hide");
    },
    _destroyPopover: function() {
      this.$el.parent().parent().data("binf.popover") && this.$el.parent().parent().binf_popover("destroy");
    }
  });
});