/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "dctmw/utils/constants", "dctmw/utils/client.location", "dctmw/utils/authenticators/session", "i18n!dctmw/pages/error/impl/nls/lang", "hbs!dctmw/pages/error/impl/start.page.error", "hbs!dctmw/pages/error/impl/location.page.error", "css!dctmw/pages/error/impl/start.page.error" ], function(_, $, Marionette, base, constants, clientLocation, Session, lang, Template, LocationErrorTemplate) {
  var StartPageErrorView = Marionette.ItemView.extend({
    className: "start-page-error",
    template: Template,
    ui: {
      errorMessageWrapper: ".error-message-wrapper",
      signOutButton: ".buttons-container .signout-user",
      pageReloadButton: ".buttons-container .page-reload"
    },
    events: {
      "click @ui.signOutButton": "onSignOutClick",
      "keydown @ui.signOutButton": "onSignOutKeyDown",
      "click @ui.pageReloadButton": "onPageReloadClick",
      "keydown @ui.pageReloadButton": "onPageReloadKeyDown"
    },
    templateHelpers: function() {
      return {
        signOut: lang.signOutLabel,
        reloadLabel: lang.reloadLabel,
        errorMsgs: this.errMsgs,
        showHeader: !this.options.embedMode,
        showSignout: this.session.isActive() || this.options.licenseFailed,
        showReload: this.options.showPageReloadButton === true
      };
    },
    constructor: function StartPageErrorView(options) {
      options || (options = {});
      this.options = options;
      this.session = Session.get();
      this.context = this.session.getContext();
      var errMsgs = typeof this.options.errorMsg === "string" ? this.options.errorMsg : lang.appLoadingError;
      if (this.options.responseJSON) {
        if (this.options.responseJSON.status === 403 && (this.options.responseJSON.code.includes("E_LICENCE") || this.options.responseJSON.code.includes("E_LICENSE") || this.options.responseJSON.code.includes("DM_LICENSE") || this.options.responseJSON.code.includes("DM_LICENCE"))) {
          errMsgs = this.options.responseJSON.message;
          if (!this.options.embedMode) {
            this.options.licenseFailed = true;
          }
        }
      }
      if (options.locationError) {
        this.template = LocationErrorTemplate;
      }
      errMsgs = errMsgs.split("\n");
      this.errMsgs = errMsgs;
      Marionette.View.prototype.constructor.call(this, options);
    },
    initialize: function() {},
    onSignOutClick: function() {
      require([ "dctmw/commands/sign.out" ], function(CmdSignOut) {
        let cmdSignout = new CmdSignOut();
        cmdSignout.execute({
          context: this.context,
          licenseFailed: this.options.licenseFailed
        });
      }.bind(this));
    },
    getValueFromStorage: function(key, storage) {
      var appContext = window.location.pathname.split("/")[1], storeKey = "D2:" + appContext + ":" + key;
      return storage.getItem(storeKey);
    },
    signOut: function(context) {
      var dfd = $.Deferred();
      require([ "nuc/contexts/factories/connector" ], function() {
        var ConnectorFactory = arguments[0];
        var connector = context.getObject(ConnectorFactory);
        var authData = {};
        authData = JSON.parse(this.getValueFromStorage("authData", window.localStorage));
        $.ajax(connector.extendAjaxOptions({
          url: connector.connection.url + "/repositories/" + authData.repository + "/logout",
          success: function() {
            var urlParams = {};
            urlParams["nextUrl"] = encodeURIComponent(location.hash);
            urlParams[constants.AppUrlParams.LOGGED_OUT] = "true";
            connector.authenticator.unauthenticate({
              reason: "logged-out"
            });
            clientLocation.navigate("signin", {
              trigger: true,
              hashParams: urlParams
            });
            dfd.resolve();
          },
          error: dfd.reject
        }));
      }.bind(this), dfd.reject);
      return dfd.promise();
    },
    onSignOutKeyDown: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onSignOutClick();
      }
    },
    onPageReloadClick: function(event) {
      if (this.isPageReloading !== true) {
        event && event.stopPropagation();
        this.isPageReloading = true;
        clientLocation.reload();
      }
    },
    onPageReloadKeyDown: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onPageReloadClick(event);
      }
    }
  });
  return StartPageErrorView;
});