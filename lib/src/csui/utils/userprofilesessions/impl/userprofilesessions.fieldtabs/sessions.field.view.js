/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/lib/backbone", "csui/controls/progressblocker/blocker", "csui/controls/error/error.view", "csui/utils/contexts/factories/user.profile.sessions.factory", "i18n!csui/utils/userprofilesessions/impl/nls/lang", "hbs!csui/utils/userprofilesessions/impl/sessions.field", "css!csui/utils/userprofilesessions/impl/userprofilesessionstab" ], function($, _, Marionette, Backbone, BlockingView, ErrorView, UserProfileSessionsFactory, lang, Template) {
  "use strict";
  var SessionsFieldView = Marionette.ItemView.extend({
    className: "user-profile-sessions-field-view",
    template: Template,
    tagName: "div",
    templateHelpers: function() {
      var isBeforeFetch = true;
      if (this.model.get("active_sessions") !== undefined) {
        isBeforeFetch = false;
      }
      return {
        isBeforeFetch: isBeforeFetch,
        activeSessionsTitle: lang.activeSessionsTitle,
        previousSessionsTitle: lang.previousSessionsTitle,
        createTime: lang.createTime,
        lastActivity: lang.lastActivity,
        duration: lang.duration,
        lastLogin: lang.lastLogin,
        activeSessionsRecord: this.model.get("active_sessions"),
        activeSessionsDuration: this.model.get("active_session_duration"),
        previousSessionsRecord: this.model.get("previous_sessions")
      };
    },
    constructor: function(options) {
      options || (options = {});
      options.model = options.context.getModel(UserProfileSessionsFactory, options);
      Marionette.ItemView.call(this, options);
      BlockingView.imbue(this);
      this.listenTo(this.model, "request", this.blockActions).listenTo(this.model, "sync", this.showDataView).listenTo(this.model, "error", this.showErrorView).listenTo(this.model, "change", this.showDataView);
      this.model.ensureFetched({
        prepare: false
      });
    },
    showDataView: function() {
      this.render();
      this.unblockActions();
    },
    showErrorView: function() {
      this._hasError = true;
      var errorWidgetView = new ErrorView({
        model: new Backbone.Model({
          message: lang.errorMessage
        })
      });
      var errorRegion = new Marionette.Region({
        el: this.$el
      });
      errorRegion.show(errorWidgetView);
      this.unblockActions();
    }
  });
  return SessionsFieldView;
});