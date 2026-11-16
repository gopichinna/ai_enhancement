/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "d2/widgets/task.details/impl/task.notes/task.note.view", "d2/utils/format.utils", "hbs!d2/widgets/task.details/impl/task.notes/empty.note", "hbs!d2/widgets/task.details/impl/task.notes/task.notes.list", "i18n!d2/widgets/task.details/impl/nls/lang" ], function($, _, Backbone, Marionette, PerfectScrollingBehavior, ClientSideInfiniteScrollingBehavior, TaskNoteView, formatUtils, EmptyNoteTemplate, template, lang) {
  "use strict";
  var stopEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
  };
  var TaskNoteEmptyView = Marionette.ItemView.extend({
    className: "d2-task-notes-empty-list",
    template: EmptyNoteTemplate,
    templateHelpers: function() {
      return {
        text: lang.emptyNotesListLabel
      };
    },
    constructor: function TaskNoteEmptyView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return Marionette.CompositeView.extend({
    className: "d2-task-notes-list",
    template: template,
    ui: {
      notesContainer: ".d2-task-notes-list-container"
    },
    events: {
      keydown: "onKeyDownNotesList"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-task-notes-list-container",
        suppressScrollX: true
      },
      InfiniteScrolling: {
        behaviorClass: ClientSideInfiniteScrollingBehavior,
        contentParent: ".d2-task-notes-list-container",
        content: ".d2-task-note",
        fetchMoreItemsThreshold: 95,
        fetchMoreItemLength: 10
      }
    },
    childViewContainer: ".d2-task-notes-list-container",
    emptyView: TaskNoteEmptyView,
    emptyViewOptions: function() {
      return {};
    },
    childView: TaskNoteView,
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
    constructor: function TaskNotesListView(options) {
      this.collection = options.collection || new Backbone.collection();
      this.taskNotesView = options.taskNotesView;
      this.context = options.context;
      this.selectedIndex = 0;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "collection:scroll:fetch", _.bind(function() {
        this.ui.notesContainer.perfectScrollbar("update");
        this._loadMoreItemsAvailableIfNoScroll();
      }, this));
      this.listenTo(this.collection, "update", _.bind(this._highlightNewNote, this));
    },
    onShow: function() {
      $(window).on("resize", _.bind(this._loadMoreItemsAvailableIfNoScroll, this));
      this._loadMoreItemsAvailableIfNoScroll();
      if (this.taskNotesView.options.originatingView && this.taskNotesView.options.originatingView.showNotesTab) {
        this.taskNotesView.options.originatingView.showNotesTab = false;
        if (this.taskNotesView.options.originatingView && this.taskNotesView.options.originatingView.expandFirstNote) {
          this.$el.find(".d2-task-note").first().click();
          this.taskNotesView.options.originatingView.expandFirstNote = false;
        }
        if (this.taskNotesView.options.originatingView && this.taskNotesView.options.originatingView.highlightFirstNote) {
          var model = this.collection.at(0);
          model && model.trigger("highlight", true);
          this.taskNotesView.options.originatingView.highlightFirstNote = false;
        }
      }
    },
    _loadMoreItemsAvailableIfNoScroll: function() {
      this.collection.length < this.collection.totalCount && this.ui.notesContainer && this.ui.notesContainer.trigger && this.ui.notesContainer.trigger("scroll");
    },
    _highlightNewNote: function(collection, options) {
      var models = options.changes.added, newCount = 0;
      _.each(models, function(model) {
        if (!_.contains(collection.allModels, model)) {
          collection.lastFilteredAndSortedModels.unshift(model);
          collection.allModels.unshift(model);
          collection.filteredCount++;
          collection.totalCount++;
          model.trigger("highlight", true);
          newCount++;
        }
      }, this);
      if (this.selectedIndex !== 0) {
        this.getElementByIndex(this.selectedIndex).prop("tabindex", "-1");
        this.selectedIndex += newCount;
        this.getElementByIndex(this.selectedIndex).prop("tabindex", "0");
      } else {
        var previousfirstNote = this.getElementByIndex(this.selectedIndex + newCount);
        previousfirstNote && previousfirstNote.prop("tabindex", "-1");
      }
      this.taskNotesView.node.set("wf_notes_count", collection.totalCount);
    },
    getIndexByElement: function(element) {
      if (!element || !element.length) {
        return null;
      }
      var index = null, items = this.$(".d2-task-notes-list-container > .d2-task-note");
      _.find(items, function(item, i) {
        if (item === element[0]) {
          index = i;
        }
      });
      return index;
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0 || index >= this.collection.length) {
        return null;
      }
      var items = this.$(".d2-task-notes-list-container > .d2-task-note");
      return $(items[index]);
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
      }
    },
    _changeFocus: function(nextElement, previousElement, newIndex) {
      if (nextElement && nextElement !== previousElement) {
        nextElement.prop("tabindex", "0");
        previousElement && previousElement.prop("tabindex", "-1");
        nextElement.trigger("focus");
        this.selectedIndex = newIndex;
      }
    }
  });
});