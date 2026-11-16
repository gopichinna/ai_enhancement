/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/behaviors/keyboard.navigation/tabables.behavior", "nuc/utils/base", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/widgets/task.details/impl/task.notes/expanded.task.note.view", "d2/widgets/task.details/impl/task.notes/task.notes.list.view", "d2/widgets/task.details/impl/task.notes/task.note.view", "d2/widgets/task.details/impl/task.notes/task.notes.view", "nuc/models/nodes", "csui/utils/commands" ], function(_, TabablesBehavior, base, WizardTabableRegionBehavior, ExpandedTaskNoteView, TaskNotesListView, TaskNoteView, TaskNotesView, NodeCollection, commands) {
  "use strict";
  var WorkflowNoteWizardView = TaskNoteView.extend({
    constructor: function WorkflowNoteWizardView() {
      TaskNoteView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.taskNotesListView, "reset:tabindex", this._resetTabIndex);
    },
    _resetTabIndex: function() {
      if (this.taskNotesListView.selectedIndex === this.taskNotesListView.collection.indexOf(this.model)) {
        this.$el.prop("tabindex", "0");
      } else {
        this.$el.prop("tabindex", "-1");
      }
    }
  });
  var WorkflowExpandedNoteWizardView = ExpandedTaskNoteView.extend({
    constructor: function() {
      _.extend(this.behaviors, {
        TabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      ExpandedTaskNoteView.prototype.constructor.apply(this, arguments);
    },
    onKeyDownExpandedNote: function(event) {
      event.which === 27 && (this.notesView.preventKeyup = true);
      ExpandedTaskNoteView.prototype.onKeyDownExpandedNote.apply(this, arguments);
    }
  });
  var WorkflowNotesWizardListView = TaskNotesListView.extend({
    childView: WorkflowNoteWizardView,
    constructor: function() {
      _.extend(this.behaviors, {
        TabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      _.extend(this.events, {
        keyup: "onKeyUpNotesList"
      });
      TaskNotesListView.prototype.constructor.apply(this, arguments);
    },
    onKeyUpNotesList: function(event) {
      if (this.taskNotesView.preventKeyup) {
        event.stopPropagation();
        event.preventDefault();
        this.taskNotesView.preventKeyup = false;
      }
    }
  });
  return TaskNotesView.extend({
    constructor: function WorkflowNotesWizardView() {
      TaskNotesView.prototype.constructor.apply(this, arguments);
      this.notesListView.currentlyFocusedElement = function() {
        var tabElements = this.$el.find(".d2-task-note");
        this.trigger("reset:tabindex");
        tabElements = tabElements.filter('[tabindex="0"]');
        return tabElements[0];
      };
    },
    _setupNotesListView: function() {
      this.notesListView = new WorkflowNotesWizardListView({
        collection: this.collection,
        context: this.context,
        taskNotesView: this
      });
    },
    setupExpandedNoteView: function(options) {
      this.expandedTaskNoteView = new WorkflowExpandedNoteWizardView(options);
    },
    _checkAddNoteEnabled: function() {
      var addNoteCommand = commands.get("D2-AddWorkflowNote");
      this.addNoteEnabled = addNoteCommand && addNoteCommand.enabled({
        nodes: new NodeCollection([ this.node ])
      });
    },
    _showChildViews: function() {
      this._showToolbarView();
      this._showNotesListView();
      this.options.showExpanded && this.listenToOnce(this.collection, "sync", function() {
        setTimeout(function() {
          this._showExpandedTaskNote(this.options);
        }.bind(this), 50);
      });
      if (!base.isIE11()) {
        setTimeout(function() {
          this.toolbarView.trigger("dom:refresh");
        }.bind(this), 300);
        setTimeout(function() {
          this.notesListView.trigger("dom:refresh");
          this.notesListView.$el.perfectScrollbar({
            suppressScrollX: true,
            scrollYMarginOffset: 15
          });
          this.expandedTaskNoteView && this.expandedTaskNoteView.trigger("dom:refresh") && this.expandedTaskNoteView.$el.perfectScrollbar({
            suppressScrollX: true,
            scrollYMarginOffset: 15
          });
        }.bind(this), 600);
      }
    },
    _onAddTaskNoteClick: function(e) {
      e.stopPropagation();
      e.preventDefault();
      var me = this, addNoteCommand = commands.get("D2-AddWorkflowNote");
      if (addNoteCommand) {
        this.options.wizard.minimize();
        this.listenToOnce(this.options.wizard, "wizard:minimized", function() {
          addNoteCommand.execute({
            nodes: new NodeCollection([ me.node ]),
            noteCollection: me.collection
          }).always(function() {
            me.options.wizard.restore();
          });
        });
      }
      setTimeout(function() {
        me.notesListView.trigger("highlight", false);
      }, 300);
    }
  });
});