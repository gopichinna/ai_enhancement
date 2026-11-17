/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "hbs!d2/dialogs/task.add.note/impl/task.add.note", "i18n!d2/dialogs/task.add.note/impl/nls/lang", "css!d2/dialogs/task.add.note/impl/task.add.note" ], function(_, $, Backbone, Marionette, BlockingView, PerfectScrollingBehavior, WizardTabableRegionBehavior, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-task-add-note",
    template: template,
    ui: {
      textareaContainer: ".textarea-container",
      textarea: ".d2-task-note-textarea"
    },
    events: {
      "input @ui.textarea": "handleTextAreaInput"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".textarea-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    templateHelpers: function() {
      return {
        defaultText: lang.addNoteDefaultText
      };
    },
    constructor: function TaskAddNoteView(options) {
      this.wizard = options.wizard;
      this.collection = options.collection;
      this.taskModel = options.taskModel;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },
    onShow: function() {
      var model = this.wizard.footerView && this.wizard.footerView.collection && this.wizard.footerView.collection.findWhere({
        id: "next"
      });
      this.nextBtnView = model && this.wizard.footerView.children.findByModel(model);
    },
    handleTextAreaInput: function() {
      this.setSaveButtonState();
      this.autoAdjustHeight();
    },
    setSaveButtonState: function() {
      var noteContent = $.trim(this.ui.textarea.val());
      if (noteContent !== "") {
        this.nextBtnView && this.nextBtnView.$el.prop("disabled") && this.nextBtnView.$el.prop("disabled", false);
      } else {
        this.nextBtnView && !this.nextBtnView.$el.prop("disabled") && this.nextBtnView.$el.prop("disabled", true);
      }
    },
    autoAdjustHeight: function() {
      this.ui.textarea.css("height", "");
      this.ui.textarea.css("height", this.ui.textarea.prop("scrollHeight") + 2 + "px");
      this.ui.textareaContainer.perfectScrollbar("update");
    }
  });
});