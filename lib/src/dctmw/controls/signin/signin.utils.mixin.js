/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import {
  Collection
} from "nuc/lib/backbone";

import ConnectorFactory from "csui/utils/contexts/factories/connector";

import ApplicationListView from "dctmw/controls/signin/application.list.view";

import LocationListView from "dctmw/controls/signin/location.list.view";

import RepositoryListView from "dctmw/controls/signin/repository.list.view";

import Session from "dctmw/utils/authenticators/session";

import constants from "dctmw/utils/constants";

import utils from "dctmw/utils/utils";

import lang from "i18n!dctmw/controls/signin/impl/nls/localized.strings";

var lastSelItemsStorage = utils.getLocalStore(constants.StorageKey.LAST_SELECTED_LOGIN_ITEMS);

const SigninUtilityMixin = {
  mixin(proto) {
    Object.assign(proto, {
      _parseQueryParams: function() {
        let queryParams = $.parseParams(window.location.search);
        var hashParamIndex = window.location.hash.indexOf("?");
        if (hashParamIndex !== -1) {
          Object.assign(queryParams, $.parseParams(window.location.hash.substr(hashParamIndex)));
        }
        return queryParams;
      },
      showDropdownFields: function() {
        this.repositoriesListView = new RepositoryListView({
          collection: new Collection()
        });
        this.repositoriesRegion.show(this.repositoriesListView);
        this.applicationListView = new ApplicationListView({
          collection: new Collection()
        });
        this.applicationRegion.show(this.applicationListView);
        this.locationListView = new LocationListView({
          collection: new Collection()
        });
        this.locationRegion.show(this.locationListView);
      },
      _updateView: function() {
        if (!this._isRendered) {
          return;
        }
        const queryParams = this._parseQueryParams();
        this._queryParams = queryParams;
        this.ensureConnector();
        this.autoLogin();
        this.setInitalFormState();
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
          if (lastSelectedRepoFromStorage && lastSelectedRepoFromStorage !== "null") {
            repository = this.repositoriesListView.getRepositoryById(lastSelectedRepoFromStorage);
          }
          if (this._queryParams.docbase) {
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
      ensureConnector: function() {
        if (!this.connector) {
          var session = Session.get(), context = session.getContext();
          if (this._isSsoAuthFailure() || this._isSkipSso()) {
            session.forceBasicAuthenticator();
          }
          this.connector = context.getObject(ConnectorFactory);
        }
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
      onKeyUp: function(event) {
        if (event.which !== undefined) {
          delete this._queryParams.loggedout;
        }
        this.validate(event);
      },
      onKeyPress: function(event) {
        var isButtonDisabled = this.ui.loginButton.prop("disabled");
        if (!isButtonDisabled && event.which === 13) {
          this.ui.loginButton.toggleClass("login-btn-enabled");
        }
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
      autoLogin: function() {
        var queryParams = this._queryParams, userName = queryParams[constants.UrlParams.USERNAME], password = queryParams[constants.UrlParams.PASSWORD], repo = queryParams[constants.UrlParams.REPOSITORY], application = queryParams[constants.UrlParams.APPLICATION], networkLocation = queryParams[constants.UrlParams.NETWORK_LOCATION], ssoAuthFail = queryParams[constants.AppUrlParams.NETWORK_LOCATION], loggedOut = queryParams[constants.AppUrlParams.LOGGED_OUT];
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
      onRepositoryChange: function(event) {
        const queryParams = this._queryParams;
        var currentRepoName = this.getSelectedRepository();
        lastSelItemsStorage.set(constants.LastSelectedLoginItems.REPOSITORY, currentRepoName);
        var currentRepo = this._findRepoModel(currentRepoName);
        this.applicationListView.collection.reset();
        this.applicationListView.$el.empty();
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
        this._testAndPrependPlaceholder(this.applicationListView, lang.signinPlaceholderApplication);
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
        return this.locationListView.collection.length >= 1;
      },
      onClickLoginButton: function() {
        const queryParams = this._queryParams;
        this.ui.loginButton.toggleClass("login-btn-enabled", false);
        var currentRepoName = this.getSelectedRepository();
        var username = this.getUserName();
        var domain = this.getDomain();
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
          password: this.getPassword(),
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
      doLogin: function(credentials) {
        if (this._loginInProgress) {
          return;
        }
        this._loginInProgress = true;
        this.ensureConnector();
        this.connector.connection.credentials = credentials;
        this.connector.authenticator.once("loggedIn", () => {
          this.trigger("success", credentials);
          this._loginInProgress = false;
        });
        var successHandler = () => {
          this._successHandler();
        }, errorHandler = error => {
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
            this._onAuthError();
          }
          this.ui.loginButton.toggleClass("login-btn-enabled", false);
          this.ui.loginButton.prop("disabled", "true");
          this.trigger("failure", {
            username: credentials.username,
            error: error
          });
        };
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
        return this._queryParams[constants.SSO_AUTH_FAILURE_PARAM] === "true";
      },
      _isJustLoggedOut() {
        return this._queryParams.loggedout === "true";
      },
      _isSkipSso: function() {
        return this._queryParams[constants.SKIP_SSO_PARAM] === "true";
      }
    });
  }
};

export default SigninUtilityMixin;