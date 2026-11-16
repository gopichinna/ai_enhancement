/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "dctmw/utils/authenticators/session", "dctmw/utils/rest.resources", "hbs!dctmw/pages/signout/impl/signout", "i18n!dctmw/pages/signout/impl/nls/lang", "css!dctmw/pages/signout/impl/signout" ], function(_, Marionette, Session, RestResources, template, lang) {
  "use strict";
  var SignoutView = Marionette.ItemView.extend({
    className: "signout-view",
    template: template,
    ui: {
      messageWrapper: ".message-wrapper",
      signOutButton: ".buttons-container .signout-user"
    },
    events: {
      "click @ui.signOutButton": "onSignOutClick",
      "keydown @ui.signOutButton": "onSignOutKeyDown"
    },
    templateHelpers: function() {
      return {
        showHeader: !this.options.embedMode,
        signOut: lang.signOutLabel,
        messages: this.messages,
        showSignout: this.session.isActive()
      };
    },
    constructor: function SignoutView(options = {}) {
      this.options = options;
      this.session = Session.get();
      this.context = this.session.getContext();
      this.messages = options.messages || [ _.str.sformat(lang.message, RestResources.getCurrentUser().get("name")) ];
      Marionette.View.prototype.constructor.call(this, options);
    },
    onSignOutKeyDown: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onSignOutClick();
      }
    },
    onSignOutClick: function() {
      require([ "dctmw/commands/sign.out" ], function(CmdSignOut) {
        let cmdSignout = new CmdSignOut();
        cmdSignout.execute({
          context: this.context
        });
      }.bind(this));
    }
  });
  return SignoutView;
});