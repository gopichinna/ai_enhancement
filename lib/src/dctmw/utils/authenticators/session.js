/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/models/member", "nuc/utils/url", "nuc/utils/authenticators/authenticators", "nuc/contexts/context", "nuc/contexts/factories/connector", "dctmw/models/product.info", "dctmw/models/repositories", "dctmw/models/session/current.user", "dctmw/models/session/current.user.preference", "dctmw/utils/constants", "dctmw/utils/rest.resources", "dctmw/utils/rest.linkrels", "dctmw/utils/utils", "dctmw/utils/geolocation.utils", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/client.location", "dctmw/utils/session.data.storage", "dctmw/utils/sw.utils" ], function(module, require, i18n, $, _, Marionette, MemberModel, Url, authenticators, BaseContext, ConnectorFactory, ProductInfoModel, RepositoryCollection, CurrentUserModel, CurrentUserPreference, constants, RestResources, RestLinkrels, utils, LocationUtils, authStorage, clientLocation, sessionDataStore, serviceWorker) {
  "use strict";
  var config = _.extend({}, module.config()), authXHR, sessionInstance, isSessionInited = false, isSessionActive = false, isSessionReloading = false, forcedAuthMode, lastAuthData, UNLOAD_TIME_KEY = "unloadTime", STALE_TAB_THRESHOLD = 6e5;
  function assignAuthenticator(connector) {
    connector = connector || sessionInstance.context.getObject(ConnectorFactory);
    if (forcedAuthMode) {
      connector.connection.authMode = forcedAuthMode;
    }
    var Authenticator = authenticators.findByConnection(connector.connection), oldAuthenticator = connector.authenticator;
    connector.authenticator = new Authenticator({
      connection: connector.connection
    });
    oldAuthenticator && oldAuthenticator.off("loggedIn", handleLogin);
    connector.authenticator.on("loggedIn", handleLogin);
    oldAuthenticator && oldAuthenticator.off("loggedOut", handleLogout);
    connector.authenticator.on("loggedOut", handleLogout);
    sessionInstance.connector = connector;
  }
  function isSignin() {
    var loc = window.location, signinUrl = sessionInstance.connector.authenticator.getSigninUrl();
    return loc.hash.indexOf(signinUrl) === 0;
  }
  function navigateToSignIn(keepAuthData) {
    if (!isSignin()) {
      var loc = window.location, signinUrl = sessionInstance.connector.authenticator.getSigninUrl(), query = "";
      query += "?nextUrl=" + encodeURIComponent(loc.hash);
      if (keepAuthData !== true) {
        authStorage.removeCurrTabData();
      }
      utils.openUrlInWindow(signinUrl + query);
    }
  }
  function compactObject(obj) {
    return _.chain(_.pairs(obj)).reject(pair => {
      return pair[1] === undefined || pair[1] === null || pair[1] === "";
    }).object().value();
  }
  function isSameAuthContext(currentAuthContext, doNotCompareUsername) {
    if (_.isObject(lastAuthData)) {
      let lastAuthContext = lastAuthData;
      if (doNotCompareUsername) {
        lastAuthContext = _.omit(lastAuthContext, "username");
        currentAuthContext = _.omit(currentAuthContext, "username");
      }
      if (_.has(currentAuthContext, "networkLocation")) {
        currentAuthContext = _.omit(currentAuthContext, "networkLocation");
      }
      return _.isEqual(compactObject(lastAuthContext), compactObject(currentAuthContext));
    }
    return true;
  }
  function handleLogin({
    xhr,
    connection: {
      credentials
    }
  }) {
    authXHR = xhr;
    if (_.isObject(lastAuthData)) {
      const areSame = isSameAuthContext(credentials, sessionInstance.connector.authenticator.isExternalSignin());
      if (!areSame) {
        isSessionReloading = true;
        sessionInstance.trigger("reload");
      }
    }
  }
  function handleLogout(args) {
    if (getAuthData().username) {
      sessionDataStore.saveUserRestorableFragment(window.location.hash);
    }
    sessionInstance.active = false;
    authXHR = undefined;
    var evtArgs = _.extend({}, args);
    endSession(evtArgs);
    _.defaults(args, evtArgs);
    if (args.reason !== "logged-out") {
      navigateToSignIn();
    }
  }
  function getAuthData() {
    var currentUserData = RestResources.getCurrentUser(), currUser = currentUserData && _.isFunction(currentUserData.get) && currentUserData.get("id") || undefined, currTabData = authStorage.getCurrTabData(), currRepo = currTabData && currTabData[constants.AuthStorage.REPOSITORY], currApp = currTabData && currTabData[constants.AuthStorage.APPLICATION];
    return {
      username: currUser,
      repositoryName: currRepo,
      application: currApp
    };
  }
  function beginSession() {
    lastAuthData = getAuthData();
    sessionDataStore.saveSessionResidue(lastAuthData);
    if (!isSessionActive) {
      isSessionActive = true;
      sessionInstance.trigger("begin");
    }
  }
  function endSession(evtArgs) {
    var isObj = _.isObject(evtArgs);
    if (isObj) {
      sessionDataStore.saveSessionRestorableFragment(window.location.hash);
    } else {
      sessionDataStore.clearSessionRestorableFragment();
      evtArgs = {};
    }
    if (isSessionActive) {
      isSessionActive = false;
      sessionInstance.trigger("end", evtArgs);
    }
  }
  function raiseError(error, isFatal) {
    sessionInstance.trigger("error", error, isFatal);
  }
  function raiseContextChangeEvent() {
    var context = sessionInstance.getContext();
    context && context.trigger("context:change");
  }
  function cleanupLocalStorage() {
    $(window).on("unload", function() {
      var authData = authStorage.getCurrTabData();
      if (authData && authData[constants.AuthStorage.REPOSITORY]) {
        authData[UNLOAD_TIME_KEY] = new Date().getTime();
        authStorage.setCurrTabData(authData);
      }
      return true;
    });
    var authData = authStorage.getCurrTabData();
    if (authData[UNLOAD_TIME_KEY]) {
      delete authData[UNLOAD_TIME_KEY];
      authStorage.setCurrTabData(authData);
    }
    var allTabsData = authStorage.getAllTabsData(), cleanedUp = false, currTime = new Date().getTime();
    _.each(allTabsData, function(data, key) {
      if (data[UNLOAD_TIME_KEY] && currTime - data[UNLOAD_TIME_KEY] > STALE_TAB_THRESHOLD) {
        delete allTabsData[key];
        cleanedUp = true;
      }
    });
    if (cleanedUp) {
      authStorage.setAllTabsData(allTabsData);
    }
  }
  function checkLocationDetails() {
    var deferred = $.Deferred();
    if (sessionInstance.options.embedMode === true) {
      deferred.resolve();
    } else {
      LocationUtils.fetchCurrentClientLocation().done(function() {
        deferred.resolve();
      }).fail(function() {
        var locationDetails = LocationUtils.checkLocationPermission(true), error;
        if (locationDetails.showError) {
          error = {
            errorMsg: locationDetails.errorMessage,
            locationError: true
          };
        }
        deferred.reject(true, error);
      });
    }
    return deferred.promise();
  }
  function doAuthPrevalidation() {
    const deferred = $.Deferred();
    if (isSessionReloading !== true) {
      const sameAuthContext = isSameAuthContext(getAuthData(), true);
      if (!sameAuthContext) {
        reloadSession();
      } else {
        deferred.resolve();
      }
    } else {
      isSessionReloading = false;
      reloadSession();
    }
    return deferred.promise();
  }
  function reloadSession() {
    raiseContextChangeEvent();
    clientLocation.navigate(sessionInstance.connector.authenticator.getAppPageUrl(), {
      replace: true,
      trigger: false
    });
    sessionDataStore.clearSessionRestorableFragment();
    sessionDataStore.saveSessionResidue(getAuthData());
    clientLocation.reload();
  }
  function processRepoResponse(xhr) {
    const {
      responseJSON
    } = xhr;
    const attrs = _.pick(responseJSON, "name", "description", "id", "links");
    const repos = new RepositoryCollection([ attrs ], {
      connector: sessionInstance.connector
    });
    RestResources.setCurrentRepository(repos.at(0));
    const store = utils.getLocalStore(constants.StorageKey.AUTH_DATA);
    const repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY], authRepos = store.get("authRepos") || {};
    if (_.isObject(authRepos[repo]) && _.isFunction(xhr.getResponseHeader)) {
      const csrfHeaderName = "documentum-csrf-header-name";
      let csrfTokenName = "documentum-csrf-token";
      if (xhr.getResponseHeader(csrfHeaderName) !== null) {
        csrfTokenName = xhr.getResponseHeader(csrfHeaderName);
      }
      const token = xhr.getResponseHeader(csrfTokenName);
      if (token !== null && token !== authRepos[repo]["token"]) {
        authRepos[repo]["token"] = token;
        store.set("authRepos", authRepos);
        if (sessionInstance.connector.authenticator.forceUpdateCsrf) {
          sessionInstance.connector.authenticator.forceUpdateCsrf();
        }
      }
    }
  }
  function fetchCurrentRepository() {
    const deferred = $.Deferred(), currRepoName = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY];
    if (_.isString(currRepoName) && !_.isEmpty(currRepoName)) {
      const repoHref = `/repositories/${currRepoName}`;
      if (authXHR && authXHR.responseJSON && authXHR.getResponseHeader) {
        const selfLink = RestLinkrels._getLinkMeta(authXHR.responseJSON.links || [], RestLinkrels.SELF);
        if (selfLink && selfLink.href === repoHref) {
          processRepoResponse(authXHR);
          authXHR = undefined;
          deferred.resolve();
          return deferred.promise();
        }
      }
      authXHR = undefined;
      const url = Url.combine(utils.buildLinkUrl({
        href: "/repositories"
      }), currRepoName), options = sessionInstance.connector.extendAjaxOptions({
        url: url,
        success: function(response, result, xhr) {
          processRepoResponse(xhr);
          deferred.resolve();
        }
      }), oldError = options.error;
      options.error = function(xhr) {
        if (xhr.status === 401) {
          deferred.reject();
        } else {
          oldError && oldError.apply(null, arguments);
          deferred.reject.apply(null, arguments);
        }
      };
      $.ajax(options);
    } else {
      const msg = "Missing auth data in current tab context";
      console.warn(msg);
      deferred.reject(msg);
    }
    return deferred.promise();
  }
  function fetchAndApplyUserPreference() {
    const dfd = $.Deferred();
    const currentUser = new CurrentUserModel(undefined, {
      connector: sessionInstance.connector
    });
    const cuPreference = new CurrentUserPreference(undefined, {
      connector: sessionInstance.connector
    });
    currentUser.fetch().then(() => {
      return cuPreference.fetch();
    }).then(() => {
      const prevUserModel = RestResources.getCurrentUser();
      if (prevUserModel instanceof CurrentUserModel) {
        prevUserModel.set(currentUser.attributes);
      } else {
        RestResources.setCurrentUser(currentUser);
      }
      RestResources.getCurrentUser().set("preferences", cuPreference.attributes || {});
      RestResources.getCurrentUser().set("preferencesModel", cuPreference);
      const userRestoreFragment = sessionDataStore.getUserRestorableFragment();
      const sessionRestoreFragment = sessionDataStore.getSessionRestorableFragment();
      sessionDataStore.clearRestorableFragments();
      if (lastAuthData && lastAuthData.username !== RestResources.getCurrentUser().get("id") || window.location.hash === sessionRestoreFragment && sessionRestoreFragment !== userRestoreFragment) {
        reloadSession();
        return;
      }
      if (!sessionInstance.options.mobile && !sessionInstance.options.embedMode) {
        let preloadData;
        const accessibilityEnabled = cuPreference.isAccessibilityEnabled();
        if (!config.defaultAccessibleCompliant && config.accessibilityEnabled !== accessibilityEnabled) {
          preloadData = window.sv.getPreloadData();
          preloadData.accessibilityEnabled = accessibilityEnabled;
          window.sv.savePreloadData(preloadData);
          clientLocation.reload();
          return;
        }
        if (!config.enforcedLocale && !_.isUndefined(cuPreference.getPreferredLanguage())) {
          let preferredLanguage = cuPreference.getPreferredLanguage(), i18nLoc = i18n.settings.locale;
          if (preferredLanguage === "") {
            preferredLanguage = window.navigator.language;
          }
          let loc = preferredLanguage.split("-")[0];
          let loc1 = preferredLanguage.split("_")[0];
          if (loc1 === "pt") {
            loc = loc1;
          }
          if (i18n.settings.loadableLocales.indexOf(loc) === -1) {
            loc = "en";
          }
          if (i18nLoc !== loc) {
            preloadData = window.sv.getPreloadData();
            preloadData.locale = loc;
            window.sv.savePreloadData(preloadData);
            clientLocation.reload();
            return;
          }
        }
      }
      if (serviceWorker.isEnabled()) {
        serviceWorker.setCacheAccessContext(getAuthData());
      }
      dfd.resolve();
    }).catch(() => {
      dfd.reject();
    });
    return dfd.promise();
  }
  var Session = Marionette.Object.extend({
    constructor: function Session(options) {
      options = options || {};
      this.options = options;
      this.setContext(options.context || new BaseContext());
    },
    forceBasicAuthenticator: function() {
      forcedAuthMode = "basic-ct";
      assignAuthenticator();
    },
    init: function() {
      var dfd = $.Deferred(), connector = this.context.getObject(ConnectorFactory, {
        permanent: true
      }), setupAuthenticator = function() {
        if (this.connector !== connector) {
          assignAuthenticator(connector);
          this.connector = connector;
        }
        dfd.resolve();
      }.bind(this), fetchProductInfo = function() {
        var productInfo = RestResources.getProductInfo();
        if (!(productInfo instanceof ProductInfoModel)) {
          productInfo = new ProductInfoModel({}, {
            connector: connector
          });
          RestResources.setProductInfo(productInfo);
        }
        if (productInfo.isEmpty() && this.options.productInfo) {
          try {
            productInfo.set(productInfo.parse(this.options.productInfo, {}));
          } catch (e) {
            console.warn(e);
          }
        }
        var hasConnectionParameter = !!connector.connection.authMode;
        if (hasConnectionParameter) {
          setupAuthenticator();
        } else {
          productInfo.fetch({
            headers: {
              Accept: constants.MediaTypes.DCTM_D2_V1_JSON
            },
            success: setupAuthenticator,
            error: dfd.reject
          });
        }
      }.bind(this);
      if (utils.isAppworks()) {
        require([ "mobile/utils/platform.controller" ], function(PlatformController) {
          if (PlatformController.offline()) {
            setupAuthenticator();
            dfd.resolve();
          } else {
            fetchProductInfo();
          }
        });
      } else {
        fetchProductInfo();
      }
      dfd.always(function() {
        isSessionInited = true;
        lastAuthData = sessionDataStore.getSessionResidue();
        this.trigger("init");
      }.bind(this));
      return dfd.promise();
    },
    start: function() {
      var dfd = $.Deferred(), validateSession = function() {
        var completeValidation = function() {
          var dfdLoginComplete = $.Deferred();
          var authenticator = this.connector.authenticator;
          if (_.isFunction(authenticator.postLogin)) {
            var result = authenticator.postLogin();
            if (!result) {
              dfdLoginComplete.reject();
            } else if (typeof result.then === "function") {
              result.done(dfdLoginComplete.resolve).fail(function(e) {
                dfdLoginComplete.reject(true, e);
              });
            } else {
              dfdLoginComplete.resolve();
            }
          } else {
            dfdLoginComplete.resolve();
          }
          dfdLoginComplete.done(function() {
            if (!utils.isUserAuthenticated(this.connector)) {
              dfd.reject();
              navigateToSignIn();
            } else {
              cleanupLocalStorage();
              checkLocationDetails().then(doAuthPrevalidation).then(fetchCurrentRepository).then(fetchAndApplyUserPreference).done(dfd.resolve).fail(function(continueWithError, error) {
                if (continueWithError === true) {
                  dfd.reject(true, error);
                } else {
                  dfd.reject();
                  navigateToSignIn();
                }
              });
            }
          }.bind(this)).fail(dfd.reject);
        }.bind(this);
        if (this.isActive()) {
          checkLocationDetails().done(dfd.resolve).fail(dfd.reject);
        } else if (this.options.appworks) {
          require([ "mobile/utils/platform.controller" ], function(PlatformController) {
            if (PlatformController.allowOffline() && PlatformController.offline()) {
              checkLocationDetails().done(dfd.resolve.bind(dfd)).fail(dfd.reject);
            } else if (isSignin()) {
              checkLocationDetails().done(dfd.resolve.bind(dfd, true)).fail(dfd.reject);
            } else {
              completeValidation();
            }
          }, raiseError);
        } else if (isSignin()) {
          checkLocationDetails().done(dfd.resolve.bind(dfd, true)).fail(dfd.reject);
        } else {
          completeValidation();
        }
      }.bind(this);
      dfd.done(function(sessionNotReady) {
        if (sessionNotReady !== true) {
          beginSession();
        }
      }).fail(function(shouldContinue, error) {
        if (shouldContinue === true) {
          raiseError(error, false);
        } else {
          error = shouldContinue;
          if (error) {
            raiseError(error, true);
          }
        }
        endSession();
      });
      this.init().done(validateSession).fail(dfd.reject);
      return dfd.promise();
    },
    getContext: function() {
      return this.context;
    },
    setContext: function(context) {
      if (this.context !== context) {
        this.context = context;
        if (this.connector) {
          this.connector = this.context.getObject(ConnectorFactory, {
            connector: this.connector
          });
        }
      }
    },
    navigateToSignIn: navigateToSignIn,
    isActive: function() {
      return isSessionActive;
    },
    isInitialized: function() {
      return isSessionInited;
    }
  });
  return {
    get: function(options) {
      if (!sessionInstance) {
        sessionInstance = new Session(options);
      }
      return sessionInstance;
    }
  };
});