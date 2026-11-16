/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/widgets/task.details/impl/task.notes/task.note.header.view", "hbs!d2/widgets/task.details/impl/task.notes/task.note", "css!d2/widgets/task.details/impl/task.notes/task.note" ], function(_, $, Backbone, Marionette, TaskNoteHeaderView, template) {
  "use strict";
  var TaskNoteView = Marionette.LayoutView.extend({
    className: "d2-task-note",
    template: template,
    ui: {
      noteContent: ".d2-task-note-content"
    },
    regions: {
      noteHeaderContainer: ".d2-task-note-header-container"
    },
    events: {
      click: "onClickNote",
      keydown: "onKeyDownNote",
      focus: "_onFocus",
      focusout: "_onFocusOut"
    },
    templateHelpers: function() {
      return {
        noteAuthor: this.noteAuthor,
        noteDate: this.noteDate,
        noteDateTitle: this.noteDateTitle,
        noteContent: this.noteContent
      };
    },
    constructor: function TaskNoteView(options) {
      this.context = options.context;
      this.noteAuthor = options.noteAuthor || "";
      this.noteDate = options.noteDate || "";
      this.noteDateTitle = options.noteDateTitle || "";
      this.noteContent = options.noteContent || "";
      this.noteContent = $("<div/>").text(this.noteContent).html();
      this.noteContent = this.noteContent.replace(/\\n/g, "<br/>");
      this.taskNotesListView = options.taskNotesListView;
      this.taskNotesView = options.taskNotesView;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this._setHeaderView();
      this.listenTo(this.taskNotesListView, "highlight", _.bind(this._highlightNote, this));
      this.listenTo(this.model, "highlight", _.bind(this._highlightNote, this));
    },
    _highlightNote: function(highlight) {
      highlight ? this.$el.addClass("note-highlight") : this.$el.removeClass("note-highlight");
    },
    onRender: function() {
      this._showHeaderView();
    },
    _setHeaderView: function() {
      this.noteHeaderView = new TaskNoteHeaderView({
        context: this.context,
        noteDate: this.noteDate,
        noteAuthor: this.noteAuthor,
        noteDateTitle: this.noteDateTitle
      });
    },
    _showHeaderView: function() {
      this.noteHeaderContainer.show(this.noteHeaderView);
    },
    _onFocus: function() {
      this.noteHeaderView.ui.noteAuthorContainer.prop("tabindex", "0");
      this.noteHeaderView.ui.noteDate.prop("tabindex", "0");
      this.ui.noteContent.prop("tabindex", "0");
    },
    _onFocusOut: function() {
      var me = this;
      setTimeout(function() {
        if (me.$el.has(document.activeElement).length === 0) {
          me.noteHeaderView.ui.noteAuthorContainer.removeAttr("tabindex");
          me.noteHeaderView.ui.noteDate.removeAttr("tabindex");
          me.ui.noteContent.removeAttr("tabindex");
        }
      });
    },
    _setTabIndex: function() {
      if (this.taskNotesListView.getElementByIndex(this.taskNotesListView.selectedIndex)[0] === this.el) {
        this.$el.prop("tabindex", "0");
      } else {
        this.$el.prop("tabindex", "-1");
      }
    },
    onShow: function() {
      this._setTabIndex();
    },
    onKeyDownNote: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickNote(event, {
          showFocused: true
        });
        break;
      }
    },
    onClickNote: function(event, options) {
      event.stopPropagation();
      event.preventDefault();
      this.taskNotesView && this.taskNotesView.trigger("d2:expanded:task:note", {
        noteAuthor: this.noteAuthor,
        noteDate: this.noteDate,
        noteDateTitle: this.noteDateTitle,
        noteContent: this.noteContent,
        originatingNoteIndex: this.taskNotesListView.getIndexByElement(this.$el),
        showFocused: options && options.showFocused
      });
    }
  });
  return TaskNoteView;
});