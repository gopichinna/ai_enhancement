/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/connector", "dctmw/controls/signin/repository.list.view", "dctmw/controls/signin/application.list.view", "dctmw/controls/signin/location.list.view", "dctmw/utils/authenticators/session", "dctmw/utils/rest.linkrels", "dctmw/utils/utils", "dctmw/utils/constants", "hbs!dctmw/controls/signin/impl/unity.signin", "i18n!dctmw/controls/signin/impl/nls/localized.strings", "css!dctmw/controls/signin/impl/css/unity.signin" ], function(_, $, Backbone, Marionette, ConnectorFactory, RepositoryListView, ApplicationListView, LocationListView, Session, RestLinkrels, utils, constants, template, lang) {
  "use strict";
  var lastSelItemsStorage = utils.getLocalStore(constants.StorageKey.LAST_SELECTED_LOGIN_ITEMS), queryParams;
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
    _parseQueryParams: function() {
      queryParams = $.parseParams(window.location.search);
      var hashParamIndex = window.location.hash.indexOf("?");
      if (hashParamIndex !== -1) {
        _.extend(queryParams, $.parseParams(window.location.hash.substr(hashParamIndex)));
      }
    },
    _updateView: function() {
      if (!this._isRendered) {
        return;
      }
      this._parseQueryParams();
      this.ensureConnector();
      this.autoLogin();
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
      if (this.model.attributes && Object.prototype.hasOwnProperty.call(this.model.attributes, constants.MOBILE_VIEW_ENABLED)) {
        var mobileStore = utils.getLocalStore(constants.StorageKey.MOBILE);
        mobileStore.set(constants.MOBILE_VIEW_ENABLED, this.model.attributes[constants.MOBILE_VIEW_ENABLED]);
      }
      this.model.repositories.forEach(function(repository) {
        this.repositoriesListView.collection.add(repository);
      }.bind(this));
      this.model.networkLocations.forEach(function(netloc) {
        this.locationListView.collection.add(netloc);
      }.bind(this));
      if (this.repositoriesListView.collection.length < 1) {
        this._setFatalErrorStyle(lang.repoNotAvailable);
      } else {
        this._testAndPrependPlaceholder(this.repositoriesListView, lang.signinPlaceholderRepository);
        var lastSelectedRepoFromStorage = lastSelItemsStorage.get(constants.LastSelectedLoginItems.REPOSITORY);
        var repository;
        if (lastSelectedRepoFromStorage && lastSelectedRepoFromStorage != "null") {
          repository = this.repositoriesListView.getRepositoryById(lastSelectedRepoFromStorage);
        }
        if (queryParams.docbase) {
          this.repositoriesListView.$el.val(queryParams.docbase);
        } else if (repository) {
          this.repositoriesListView.$el.val(repository.id);
        } else if (this.repositoriesListView.collection.length > 1) {
          var index = 0;
          var defaultId = this.model.get("defaultRepositoryName");
          if (defaultId) {
            index = this.repositoriesListView.getRepositoryIndex(defaultId);
          }
          this.repositoriesListView.el.selectedIndex = index;
        }
        this.onRepositoryChange();
        this._testAndPrependPlaceholder(this.locationListView, lang.signinPlaceholderLocation);
        var lastSelectedLocationFromStorage = lastSelItemsStorage.get(constants.LastSelectedLoginItems.NETWORK_LOCATION);
        if (lastSelectedLocationFromStorage) {
          this.locationListView.$el.val(lastSelectedLocationFromStorage);
        } else {
          if (this.locationListView.collection.length > 1) {
            this.locationListView.el.selectedIndex = 0;
          }
        }
        this.validate();
        if (this._isSsoAuthFailure()) {
          this._setErrorStyle(lang.ssoUserNotValidForRepository, true);
        }
      }
      if (this.queryParamErroMsg) {
        this._setErrorStyle(this.queryParamErroMsg, false);
        this.queryParamErroMsg = undefined;
      }
      this.trigger("view:updated");
      if (queryParams.docbase && !this.repositoriesListView.getRepositoryById(queryParams.docbase)) {
        this._setFatalErrorStyle(lang.invalidRepoInUrl, true);
      } else {
        if (!this._isJustLoggedOut() && this.connector.authenticator.isExternalSignin() && this.repositoriesListView.collection.length === 1 && this.applicationListView.collection.length < 2 && this.locationListView.collection.length < 2) {
          if (!this._isSsoAuthFailure() || !this._isSkipSso()) {
            this.hideLoginPageFields();
            this.onClickLoginButton();
          }
        }
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
    isExternalSignin: function() {
      return this.connector && this.connector.authenticator.isExternalSignin();
    },
    getApplication: function(applications, applicationNameOrParam) {
      var app;
      if (applications) {
        applications.some(function(application) {
          if (application.applicationName === applicationNameOrParam || application.applicationParameter === applicationNameOrParam) {
            app = application;
            return true;
          }
        });
      }
      return app;
    },
    autoLogin: function() {
      var userName = queryParams[constants.UrlParams.USERNAME], password = queryParams[constants.UrlParams.PASSWORD], repo = queryParams[constants.UrlParams.REPOSITORY], application = queryParams[constants.UrlParams.APPLICATION], networkLocation = queryParams[constants.UrlParams.NETWORK_LOCATION], ssoAuthFail = queryParams[constants.AppUrlParams.NETWORK_LOCATION], loggedOut = queryParams[constants.AppUrlParams.LOGGED_OUT];
      if (userName && password && repo || this.isExternalSignin() && repo && !ssoAuthFail && !loggedOut) {
        if (application) {
          var repoModel = this._findRepoModel(repo);
          if (!repoModel) {
            return;
          }
          if (!this.getApplication(repoModel.get("applications"), application)) {
            this.queryParamErroMsg = lang.invalidApplicationInUrl;
            return;
          }
        }
        this.$el.addClass("binf-hidden");
        this.doLogin({
          username: userName,
          password: password,
          repositoryName: repo,
          application: application,
          networkLocation: networkLocation
        });
      } else {
        this.$el.removeClass("binf-hidden");
      }
    },
    onRender: function() {
      this.ui.username.prop("autofocus", true);
      this.repositoriesListView = new RepositoryListView({
        collection: new Backbone.Collection()
      });
      this.repositoriesRegion.show(this.repositoriesListView);
      this.applicationListView = new ApplicationListView({
        collection: new Backbone.Collection()
      });
      this.applicationRegion.show(this.applicationListView);
      this.locationListView = new LocationListView({
        collection: new Backbone.Collection()
      });
      this.locationRegion.show(this.locationListView);
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
    getSelectedRepository: function() {
      return this.repositoriesListView.$el.val();
    },
    getSelectedApplication: function() {
      return this.applicationListView.$el.val();
    },
    getApplicationNameByNameFromRepo: function(repo, applicationName) {
      var appName;
      repo.get("applications").some(function(app) {
        if (app["applicationName"] === applicationName) {
          appName = app["applicationName"];
          return true;
        }
      });
      return appName;
    },
    getApplicationNameByParamFromRepo: function(repo, applicationParam) {
      var appName;
      repo.get("applications").some(function(app) {
        if (app["applicationParameter"] === applicationParam) {
          appName = app["applicationName"];
          return true;
        }
      });
      return appName;
    },
    getSelectedLocation: function() {
      return this.locationListView.$el.val();
    },
    onChangeUsername: function() {
      this.validate();
    },
    onChangePassword: function() {
      this.validate();
    },
    onChangeDomain: function() {
      this.validate();
    },
    _testAndPrependPlaceholder: function(view, placeHolderLabel) {
      let firstEl = view.$("option:first");
      if (firstEl.attr("disabled") !== "disabled" && firstEl.text() !== placeHolderLabel) {
        let optionEl = `<option disabled='disabled' hidden='hidden' value=''> ${placeHolderLabel} </option>`;
        view.$el.prepend(optionEl);
      }
    },
    onRepositoryChange: function(event) {
      var currentRepoName = this.getSelectedRepository();
      lastSelItemsStorage.set(constants.LastSelectedLoginItems.REPOSITORY, currentRepoName);
      var currentRepo = this._findRepoModel(currentRepoName);
      this.applicationListView.collection.reset();
      this._testAndPrependPlaceholder(this.applicationListView, lang.signinPlaceholderApplication);
      this.queryParamErroMsg = undefined;
      var application, applications;
      if (currentRepo) {
        applications = currentRepo.get("applications");
      }
      if (this.shouldShowApplication()) {
        var defaultApp = currentRepo.get("default_application_name");
        if (applications) {
          applications.forEach(function(application) {
            application.applicationParameter = application.applicationParameter || application.applicationName;
            if (application.isIncludedAtLogin) {
              this.applicationListView.collection.add(application);
            } else if (application.applicationName === defaultApp) {
              application.applicationLabel = lang.defaultApplication;
              this.applicationListView.collection.add(application);
            }
          }.bind(this));
        }
        var bSetApp = false;
        if (queryParams.application) {
          var queryParamsApp = this.applicationListView.getApplicationByName(queryParams.application);
          if (queryParamsApp) {
            bSetApp = true;
            this.applicationListView.$el.val(queryParamsApp);
          } else {
            queryParamsApp = this.applicationListView.getApplicationByParam(queryParams.application);
            if (queryParamsApp) {
              bSetApp = true;
              this.applicationListView.$el.val(queryParamsApp);
            } else {
              application = this.getApplication(applications, queryParams.application);
              if (!application) {
                this.queryParamErroMsg = lang.invalidApplicationInUrl;
              } else if (!application.isIncludedAtLogin) {
                application.applicationLabel = lang.applicationFromURL;
                this.applicationListView.collection.add(application);
                this.applicationListView.$el.val(application.applicationName);
                bSetApp = true;
              }
            }
          }
        }
        if (!bSetApp) {
          var lastSelectedApplicationFromStorage = lastSelItemsStorage.get(constants.LastSelectedLoginItems.APPLICATION + "_" + currentRepoName);
          if (lastSelectedApplicationFromStorage) {
            bSetApp = true;
            this.applicationListView.$el.val(lastSelectedApplicationFromStorage);
          }
        }
        if (!bSetApp && defaultApp) {
          bSetApp = true;
          this.applicationListView.$el.val(defaultApp);
        }
        if ((!bSetApp || this.applicationListView.el.selectedIndex === -1) && this.applicationListView.collection.length > 1) {
          this.applicationListView.el.selectedIndex = 0;
        }
      } else if (queryParams.application) {
        application = this.getApplication(applications, queryParams.application);
        if (!application) {
          this.queryParamErroMsg = lang.invalidApplicationInUrl;
        }
      }
      this.validate(event);
    },
    onLocationChange: function(event) {
      var currentLocationName = this.getSelectedLocation();
      lastSelItemsStorage.set(constants.LastSelectedLoginItems.NETWORK_LOCATION, currentLocationName);
      this.validate(event);
    },
    onApplicationChange: function(event) {
      var currentRepoName = this.getSelectedRepository();
      var currentApplicationName = this.getSelectedApplication();
      lastSelItemsStorage.set(constants.LastSelectedLoginItems.APPLICATION + "_" + currentRepoName, currentApplicationName);
      this.validate(event);
    },
    shouldShowApplication: function() {
      var currentRepoName = this.getSelectedRepository();
      var currentRepo = this._findRepoModel(currentRepoName);
      if (currentRepo && currentRepo.get("s_allow_application_selection") && currentRepo.get("is_matrix_application_mode")) {
        return true;
      }
      return false;
    },
    shouldShowDomain: function() {
      var currentRepoName = this.getSelectedRepository();
      var currentRepo = this._findRepoModel(currentRepoName);
      if (currentRepo && !(currentRepo.has("repository") ? currentRepo.get("repository").hideDomain : currentRepo.get("hideDomain"))) {
        return true;
      }
      return false;
    },
    shouldShowLocation: function() {
      if (this.locationListView.collection.length < 1) {
        return false;
      }
      return true;
    },
    onKeyUp: function(event) {
      if (event.which !== undefined) {
        delete queryParams.loggedout;
      }
      this.validate(event);
    },
    onKeyPress: function(event) {
      var isButtonDisabled = this.ui.loginButton.prop("disabled");
      if (!isButtonDisabled && event.which === 13) {
        this.ui.loginButton.toggleClass("login-btn-enabled");
      }
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
      delete queryParams.loggedout;
    },
    onClickRetryButton: function() {
      this.ui.retryButton.toggle(false);
      this.ui.loaderOuterBorder.toggle(true);
      this.ui.loginerror.toggle(false);
      this.trigger("refresh");
    },
    onClickLoginButton: function() {
      this.ui.loginButton.toggleClass("login-btn-enabled", false);
      var currentRepoName = this.getSelectedRepository();
      var username = this.ui.username.val();
      var domain = this.ui.domain.val();
      if (domain) {
        username = domain + "\\" + username;
      }
      var currentRepo = this._findRepoModel(currentRepoName);
      var applicationModeEnabled = currentRepo.get("is_matrix_application_mode");
      var currentApplication;
      if (queryParams.application && applicationModeEnabled) {
        currentApplication = this.getApplicationNameByNameFromRepo(currentRepo, queryParams.application);
        if (!currentApplication) {
          currentApplication = this.getApplicationNameByParamFromRepo(currentRepo, queryParams.application);
        }
      }
      if (!currentApplication) {
        currentApplication = this.getSelectedApplication();
      }
      var credentials = {
        username: username,
        password: this.ui.password.val(),
        repositoryName: currentRepoName,
        application: currentApplication,
        networkLocation: this.getSelectedLocation()
      };
      var defaultApp = currentRepo.get("default_application_name");
      if (applicationModeEnabled && !(currentApplication || defaultApp)) {
        this.ui.loginButton.toggleClass("login-btn-enabled", true);
        this._setErrorStyle(lang.signinApplicationSelectionNotAllowedWithoutDefault, false);
      } else {
        this.doLogin(credentials);
      }
    },
    ensureConnector: function() {
      if (!this.connector) {
        var session = Session.get(), context = session.getContext();
        if (this._isSsoAuthFailure() || this._isSkipSso()) {
          session.forceBasicAuthenticator();
        }
        this.connector = context.getObject(ConnectorFactory);
      }
    },
    doLogin: function(credentials) {
      if (this._loginInProgress) {
        return;
      }
      this._loginInProgress = true;
      this.ensureConnector();
      this.connector.connection.credentials = credentials;
      this.connector.authenticator.once("loggedIn", _.bind(function() {
        this.trigger("success", credentials);
        this._loginInProgress = false;
      }, this));
      var successHandler = _.bind(function() {
        this._loginInProgress = false;
        this.ui.username.val("");
        this.ui.password.val("");
      }, this), errorHandler = _.bind(function(error) {
        this._loginInProgress = false;
        if (error.statusCode !== 401) {
          if (error.statusCode === 403 && error.message) {
            try {
              let errorObj = utils.parseError("json", error.message);
              if (errorObj && errorObj.code === "E_LICENCE_VALIDATION_ERROR") {
                this._setErrorStyle(lang.noLicenseMessage, false);
              }
            } catch (err) {
              this._setErrorStyle(lang.failedRepoConnection, false);
            }
          } else {
            this._setErrorStyle(lang.failedRepoConnection, false);
          }
        } else {
          if (this.connector.authenticator.supportsBasicFallback()) {
            this.ui.username.toggle(true);
            this.ui.password.toggle(true);
            this._setErrorStyle(lang.ssoSigninFailed, true);
          } else {
            this._setErrorStyle(lang.signinInvalidUsernameOrPassword, true);
          }
        }
        this.ui.loginButton.toggleClass("login-btn-enabled", false);
        this.ui.loginButton.prop("disabled", "true");
        this.trigger("failure", {
          username: credentials.username,
          error: error
        });
      }, this);
      this.connector.authenticator.authenticate({
        credentials: credentials
      }, successHandler, errorHandler);
    },
    _findRepoModel: function(repoName) {
      return this.model.repositories.find(function(repoModel) {
        return repoModel.has("repository") ? repoModel.get("repository").repositoryName === repoName : repoModel.get("name") === repoName;
      });
    },
    _isSsoAuthFailure: function() {
      return queryParams[constants.SSO_AUTH_FAILURE_PARAM] === "true";
    },
    _isSkipSso: function() {
      return queryParams[constants.SKIP_SSO_PARAM] === "true";
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
    _isJustLoggedOut: function() {
      return queryParams.loggedout === "true";
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
  return SignInView;
});