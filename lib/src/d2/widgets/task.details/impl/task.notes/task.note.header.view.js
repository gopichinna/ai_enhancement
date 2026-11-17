/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "nuc/utils/types/date", "csui/utils/contexts/factories/connector", "dctmw/widgets/user.avatar/user.avatar.view", "hbs!d2/widgets/task.details/impl/task.notes/task.note.header", "css!d2/widgets/task.details/impl/task.notes/task.note.header" ], function(_, $, Backbone, Marionette, base, date, ConnectorFactory, UserAvatarView, template) {
  "use strict";
  var TaskNoteHeaderView = Marionette.LayoutView.extend({
    className: "d2-task-note-header",
    template: template,
    ui: {
      noteDate: ".note-date",
      noteAuthorEmail: ".note-author-container>.note-author-name-email>.note-author-email",
      noteAuthorContainer: ".note-author-container"
    },
    regions: {
      noteAuthorProfileContainer: ".note-author-profile-container"
    },
    events: {
      "keydown @ui.noteAuthorContainer": "_onNoteAuthorKeyDown",
      "keydown @ui.noteDate": "_onNoteDateKeyDown"
    },
    templateHelpers: function() {
      return {
        noteAuthor: this.noteAuthor,
        noteDateTitle: this.noteDateTitle,
        noteDate: this.noteDate,
        noteTime: date.formatExactTime(this.noteDateTitle),
        isTouchBrowser: base.isTouchBrowser()
      };
    },
    constructor: function TaskNoteHeaderView(options) {
      this.context = options.context;
      this.noteAuthor = options.noteAuthor || "";
      this.noteDate = options.noteDate || "";
      this.noteDateTitle = options.noteDateTitle || "";
      this.setTabIndex = options.setTabIndex;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this._setUserAvatarView();
    },
    onRender: function() {
      this._showUserAvatarView();
    },
    _setUserAvatarView: function() {
      this.userAvatarView = new UserAvatarView({
        userId: this.noteAuthor,
        resolvePhoto: true
      });
    },
    _showUserAvatarView: function() {
      var me = this;
      this.noteAuthorProfileContainer.show(this.userAvatarView);
      this.userAvatarView.model.ensureFetched().done(function() {
        me.$el.find(".d2-note-userprofile-pic").prop("tabindex", "-1");
        me.ui.noteAuthorContainer.prop("title", me.userAvatarView.model.get("business_email"));
        me.ui.noteAuthorEmail.html(me.userAvatarView.model.get("business_email"));
      });
    },
    onShow: function() {
      this.setTabIndex && this._setTabIndex();
    },
    _setTabIndex: function() {
      this.ui.noteAuthorContainer.prop("tabindex", "0");
      this.ui.noteDate.prop("tabindex", "0");
    },
    _onNoteAuthorKeyDown: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    },
    _onNoteDateKeyDown: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    }
  });
  return TaskNoteHeaderView;
});