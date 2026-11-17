/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "dctmw/utils/utils", "dctmw/controls/signin/signin.utils.mixin", "hbs!dctmw/controls/signin/impl/unity.signin", "i18n!dctmw/controls/signin/impl/nls/localized.strings", "css!dctmw/controls/signin/impl/css/unity.signin" ], function(_, $, Marionette, utils, SigninUtilityMixin, template, lang) {
  "use strict";
  var SignInView = Marionette.LayoutView.extend({
    className: "d2-signin",
    template: template,
    repositoriesListView: undefined,
    applicationListView: undefined,
    locationListView: undefined,
    queryParamErroMsg: undefined,
    templateHelpers: function() {
      return {
        buttontext: lang.signinButtonText,
        retrytext: lang.retryButtonText,
        copyright: lang.signinCopyright,
        forgotpassword: lang.signinForgotPassword,
        placeholderusername: lang.signinPlaceholderUsername,
        placeholderpassword: lang.signinPlaceholderPassword,
        placeholderdomain: lang.signinPlaceholderDomain,
        haveBeenLoggedOut: lang.haveBeenLoggedOut,
        closeBrowser: lang.closeBrowser,
        loginPage: lang.loginPage,
        isMobileSeperator: utils.isMobile()
      };
    },
    regions: {
      repositoriesRegion: ".d2-repositories",
      applicationRegion: ".d2-application",
      locationRegion: ".d2-location"
    },
    ui: {
      loaderOuterBorder: ".outer-border",
      logo: ".d2-logo",
      username: ".input-username",
      password: ".input-password",
      domain: ".input-domain",
      loginButton: ".btn-submit",
      retryButton: ".btn-retry",
      goToLoginPageButton: ".show-login-form-btn",
      loginerror: ".login-error",
      sep1: ".separator1",
      sep2: ".separator2",
      d2repo: ".d2-repositories",
      d2app: ".d2-application",
      d2loc: ".d2-location"
    },
    triggers: {
      "click @ui.loginButton": "click:loginButton",
      "click @ui.retryButton": "click:retryButton",
      "click @ui.goToLoginPageButton": "click:goToLoginPageButton",
      "focus @ui.username": "focus:username",
      "focus @ui.password": "focus:password",
      "focus @ui.domain": "focus:domain",
      "blur @ui.username": "blur:username",
      "blur @ui.password": "blur:password",
      "blur @ui.domain": "blur:domain",
      "change @ui.password": "change:password",
      "change @ui.username": "change:username",
      "change @ui.domain": "change:domain"
    },
    events: {
      "keyup .binf-form-control": "onKeyUp",
      "keydown .binf-form-control": "onKeyDown",
      "keydown .btn-submit": "onKeyPress",
      "change .repository-select": "onRepositoryChange",
      "change .location-select": "onLocationChange",
      "change .application-select": "onApplicationChange"
    },
    modelEvents: {
      change: "_updateView"
    },
    constructor: function SignInView(options) {
      options = options || {};
      Marionette.LayoutView.call(this, options);
      this.listenTo(this, "failure", function() {
        this.$el.removeClass("binf-hidden");
      });
    },
    setInitalFormState: function() {
      $(".signin-footer").show();
      this.ui.loginerror.text(this.welcomeValue);
      this.ui.loaderOuterBorder.toggle(false);
      this.ui.retryButton.toggle(false);
      this.ui.logo.toggle(true);
      this.ui.loginerror.toggle(true);
      this.ui.loginButton.toggle(true);
      if (!this.connector.authenticator.isExternalSignin() || this._isSsoAuthFailure() || this._isSkipSso()) {
        this.ui.username.toggle(true);
        this.ui.password.toggle(true);
      }
    },
    hideLoginPageFields: function() {
      this.ui.logo.toggle(false);
      this.ui.loginerror.toggle(false);
      this.ui.domain.toggle(false);
      this.ui.d2app.toggle(false);
      this.ui.d2loc.toggle(false);
      this.ui.loginButton.toggle(false);
      this.ui.loaderOuterBorder.toggle(true);
    },
    onRender: function() {
      this.ui.username.prop("autofocus", true);
      this.showDropdownFields();
      if (utils.isAppworks()) {
        window.csui.require([ "mobile/utils/platform.controller" ], function(PlatformController) {
          PlatformController.clearButtons([ "menu" ]);
          PlatformController.setHeader({
            title: lang.mobileHeaderName,
            backButtonVisible: false,
            menuVisible: true
          });
        });
      }
    },
    getUserName: function() {
      return this.ui.username.val();
    },
    getPassword: function() {
      return this.ui.password.val();
    },
    getDomain: function() {
      return this.ui.domain.val();
    },
    validate: function(event) {
      this._unsetErrorStyle();
      var isExternalSignin = this.isExternalSignin(), bIsUserNameSet = !!this.ui.username.val().length, bIsPasswordSet = !!this.ui.password.val().length, bIsRepoSelected = !!this.getSelectedRepository(), bIsValidInput = (!isExternalSignin && bIsUserNameSet && bIsPasswordSet || isExternalSignin) && bIsRepoSelected, bUserNameHasFocus = $(document.activeElement).is(this.ui.username), bPasswordHasFocus = $(document.activeElement).is(this.ui.password), bDomainHasFocus = $(document.activeElement).is(this.ui.domain);
      if (this.shouldShowLocation() && !this.getSelectedLocation()) {
        bIsValidInput = false;
      }
      if (this.shouldShowApplication() && !this.getSelectedApplication()) {
        bIsValidInput = false;
      }
      this.ui.loginButton.prop("disabled", !bIsValidInput);
      this.ui.loginButton.toggleClass("login-btn-enabled", bIsValidInput);
      var numElements = isExternalSignin ? 0 : 2;
      if (this.repositoriesListView.collection.length < 2) {
        this.ui.d2repo.toggle(false);
      } else {
        this.ui.d2repo.toggle(true);
        numElements++;
      }
      if (!this.shouldShowApplication()) {
        this.ui.d2app.toggle(false);
      } else {
        this.ui.d2app.toggle(true);
        numElements++;
      }
      if (!this.shouldShowDomain()) {
        this.ui.domain.toggle(false);
      } else {
        this.ui.domain.toggle(true);
        numElements++;
      }
      if (!this.shouldShowLocation()) {
        this.ui.d2loc.toggle(false);
      } else {
        this.ui.d2loc.toggle(true);
        numElements++;
      }
      if (isExternalSignin) {
        this.ui.sep1.toggle(false);
        if (numElements < 3) {
          this.ui.sep2.toggle(false);
        } else {
          this.ui.sep2.toggle(true);
        }
      } else {
        if (numElements < 4) {
          this.ui.sep1.toggle(false);
          this.ui.sep2.toggle(false);
        } else if (numElements < 5) {
          this.ui.sep1.toggle(true);
          this.ui.sep2.toggle(false);
        } else {
          this.ui.sep1.toggle(false);
          this.ui.sep2.toggle(true);
        }
      }
      if (bIsValidInput && event && event.which === 13) {
        event.preventDefault();
        this.ui.loginButton.trigger("click");
      }
      this.applicationListView.$el.toggleClass("binf-has-error", !!this.queryParamErroMsg);
      this.ui.d2app.toggleClass("error-image", !!this.queryParamErroMsg);
      this.ui.username.toggleClass("textbox-empty", !bIsUserNameSet && !bUserNameHasFocus);
      this.ui.password.toggleClass("textbox-empty", !bIsPasswordSet && !bPasswordHasFocus);
      this.ui.domain.toggleClass("textbox-empty", !this.ui.domain.val().length && !bDomainHasFocus);
    },
    onClickGoToLoginPageButton: function() {
      delete this._queryParams.loggedout;
    },
    onClickRetryButton: function() {
      this.ui.retryButton.toggle(false);
      this.ui.loaderOuterBorder.toggle(true);
      this.ui.loginerror.toggle(false);
      this.trigger("refresh");
    },
    _successHandler: function() {
      this._loginInProgress = false;
      this.ui.username.val("");
      this.ui.password.val("");
    },
    _onAuthError: function() {
      if (this.connector.authenticator.supportsBasicFallback()) {
        this.ui.username.toggle(true);
        this.ui.password.toggle(true);
        this._setErrorStyle(lang.ssoSigninFailed, true);
      } else {
        this._setErrorStyle(lang.signinInvalidUsernameOrPassword, true);
      }
    },
    _setErrorStyle: function(errorMessage, bAddIcon) {
      this.ui.loginerror.text(errorMessage);
      this.ui.loginerror.addClass("error-image");
      if (utils.isMobile()) {
        $(".d2-logo").addClass("d2mob-err-logo");
      }
      if (bAddIcon) {
        this.$(".binf-has-feedback").addClass("binf-has-error").addClass("error-image").addClass("error-icon");
        this.$el.css({
          display: "block"
        });
      }
      this.ui.username.trigger("focus").trigger("select");
      this.ui.password.val("");
      this.ui.domain.val("");
    },
    _setFatalErrorStyle: function(errorMessage, keepSigninBtn) {
      this.ui.loginerror.toggle(true);
      this.ui.logo.toggle(true);
      if (keepSigninBtn !== true) {
        this.ui.retryButton.toggle(true);
        this.ui.retryButton.prop("disabled", false);
        this.ui.retryButton.toggleClass("login-btn-enabled", true);
      }
      this.ui.loaderOuterBorder.toggle(false);
      this.ui.loginerror.text(errorMessage);
      this.ui.loginerror.addClass("error-image");
      if (utils.isMobile()) {
        $(".d2-logo").addClass("d2mob-err-logo");
      }
      if (keepSigninBtn !== true) {
        this.ui.loginButton.toggle(false);
      } else {
        this.ui.loginButton.prop("disabled", true);
      }
      this.ui.username.toggle(false);
      this.ui.password.toggle(false);
    },
    _unsetErrorStyle: function() {
      if (this._isJustLoggedOut()) {
        if (utils.isMobile() && !utils.isAppworks()) {
          this.ui.loginerror.text(_.str.sformat("{0} {1}", lang.haveBeenLoggedOut, lang.closeMobileBrowser));
          this.ui.loginerror.addClass("error-image");
          $(".d2-logo").addClass("d2mob-err-logo");
        } else {
          this.ui.loginerror.text(_.str.sformat("{0}\n{1}", lang.haveBeenLoggedOut, lang.closeBrowser));
        }
      } else {
        this.ui.loginerror.text(this.welcomeValue);
        if (utils.isMobile()) {
          this.ui.loginerror.removeClass("error-image");
          $(".d2-logo").removeClass("d2mob-err-logo");
        }
      }
      this.ui.username.prop("disabled", false);
      this.ui.password.prop("disabled", false);
      this.$(".binf-form-group").removeClass("binf-has-error").removeClass("error-image").removeClass("error-icon");
    }
  });
  SigninUtilityMixin.mixin(SignInView.prototype);
  return SignInView;
});