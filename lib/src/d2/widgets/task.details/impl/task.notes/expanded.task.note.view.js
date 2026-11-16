/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "hbs!d2/widgets/task.details/impl/task.notes/task.expanded.note" ], function(Marionette, PerfectScrollingBehavior, template) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-task-expanded-note",
    template: template,
    events: {
      keydown: "onKeyDownExpandedNote"
    },
    ui: {
      expandedNoteContent: ".d2-task-expanded-note-content"
    },
    templateHelpers: function() {
      return {
        noteContent: this.noteContent
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-task-expanded-note-container",
        suppressScrollX: true
      }
    },
    constructor: function ExpandedTaskNoteView(options) {
      this.noteContent = options.noteContent || "";
      this.notesView = options.notesView;
      this.originatingNoteIndex = options.originatingNoteIndex;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onKeyDownExpandedNote: function(event) {
      switch (event.which) {
       case 27:
       case 8:
        this.notesView && this.notesView._onBackToNotesListClick(event, {
          showFocused: true,
          originatingNoteIndex: this.originatingNoteIndex
        });
        break;
      }
    }
  });
});