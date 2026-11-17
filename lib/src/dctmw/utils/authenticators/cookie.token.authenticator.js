/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/utils/url", "dctmw/utils/authenticators/base.authenticator", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/utils", "dctmw/utils/constants", "dctmw/utils/client.location" ], function(require, _, Url, BaseAuthenticator, authStorage, utils, constants, clientLocation) {
  "use strict";
  var AUTH_REPOS = "authRepos", CSRF_HEADER_KEY = "documentum-csrf-header-name", CSRF_TOKEN_KEY = "documentum-csrf-token", getParamKey = function(key) {
    return (constants.SSO_PARAM_PREFIX + key).toLowerCase();
  };
  var CookieTokenAuthenticator = BaseAuthenticator.extend({
    constructor: function CookieTokenAuthenticator() {
      var me = this;
      BaseAuthenticator.prototype.constructor.apply(me, arguments);
      me.store = utils.getLocalStore(constants.StorageKey.AUTH_DATA);
      me.listenTo(me, "loggedIn", function(ev) {
        if (ev && ev.data) {
          me._setRepoAuthenticated(true, ev.data.csrf);
        } else {
          me._setRepoAuthenticated(true);
        }
      });
      me._loadCsrfData = _.throttle(function() {
        var repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY], authRepos = me.store.get(AUTH_REPOS) || {};
        if (_.isObject(authRepos[repo])) {
          me._csrfData = authRepos[repo];
        }
      }, 2e3);
    },
    forceUpdateCsrf: function() {
      var repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY], authRepos = this.store.get(AUTH_REPOS) || {};
      if (_.isObject(authRepos[repo])) {
        this._csrfData = authRepos[repo];
      }
    },
    handleSuccess: function(credentials, succeeded, eventData, xhr) {
      if (xhr) {
        var csrfHeaderName, token;
        eventData = eventData || {};
        if (_.isFunction(xhr.getResponseHeader)) {
          token = xhr.getResponseHeader(CSRF_TOKEN_KEY);
          if (token) {
            eventData.csrf = {
              csrfHeaderName: xhr.getResponseHeader(CSRF_HEADER_KEY),
              token: token
            };
          }
        } else {
          for (var key in xhr) {
            if (Object.prototype.hasOwnProperty.call(xhr, key)) {
              if (key.toLowerCase() === CSRF_HEADER_KEY) {
                csrfHeaderName = xhr[key];
              } else if (key.toLowerCase() === CSRF_TOKEN_KEY) {
                token = xhr[key];
              }
            }
          }
          if (token) {
            eventData.csrf = {
              csrfHeaderName: csrfHeaderName,
              token: token
            };
          }
        }
      }
      return BaseAuthenticator.prototype.handleSuccess.call(this, credentials, succeeded, eventData, xhr);
    },
    unauthenticate: function() {
      this._setRepoAuthenticated(false);
      return BaseAuthenticator.prototype.unauthenticate.apply(this, arguments);
    },
    checkAuthenticated: function() {
      return this._isRepoAuthenticated();
    },
    updateAuthHeaders: function(headers) {
      var csrfData = this._getCsrfData();
      if (csrfData) {
        headers[csrfData.csrfHeaderName] = csrfData.token;
      }
    },
    _credentialsToParams: function(credentials, params) {
      if (credentials) {
        if (credentials.repositoryName) {
          params[getParamKey(constants.AuthStorage.REPOSITORY)] = credentials.repositoryName;
        }
        if (credentials.application) {
          params[getParamKey(constants.AuthStorage.APPLICATION)] = credentials.application;
        }
        if (credentials.networkLocation) {
          params[getParamKey(constants.AuthStorage.NETWORK_LOCATION)] = credentials.networkLocation;
        }
      }
    },
    _paramsToCredentials: function(params, credentials) {
      var convert = function(key, cKey) {
        var pKey = getParamKey(key);
        if (params[pKey]) {
          credentials[cKey] = params[pKey];
          delete params[pKey];
        }
      };
      if (params) {
        convert(constants.AuthStorage.REPOSITORY, "repositoryName");
        convert(constants.AuthStorage.APPLICATION, "application");
        convert(constants.AuthStorage.NETWORK_LOCATION, "networkLocation");
      }
    },
    _setRepoAuthenticated: function(flag, csrf) {
      var repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY], authRepos = this.store.get(AUTH_REPOS) || {};
      if (flag) {
        authRepos[repo] = csrf || authRepos[repo] || true;
      } else {
        delete authRepos[repo];
      }
      this.store.set(AUTH_REPOS, authRepos);
    },
    _isRepoAuthenticated: function() {
      var repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY], authRepos = this.store.get(AUTH_REPOS) || {};
      return !!authRepos[repo];
    },
    _getCsrfData: function() {
      this._loadCsrfData();
      return this._csrfData;
    },
    updateAuthenticatedSession: function() {
      require([ "csui/utils/user.session/user.session" ], function(UserSession) {
        if (UserSession.isSessionExpirationEnabled()) {
          if (this.connection && !this.connection.session) {
            this.connection.session = {};
          }
          var repo = authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY];
          var repoData = authStorage.getAuthRepoData(repo);
          if (repoData && repoData[constants.AuthStorage.SESSION_EXPIRY]) {
            this.connection.session.expires = repoData[constants.AuthStorage.SESSION_EXPIRY];
            this.connection.session.serverDate = repoData[constants.AuthStorage.SESSION_SERVER_DATE];
          } else {
            this.connection.session = {};
          }
          UserSession.updateSessionTicket(this);
          repoData[constants.AuthStorage.SESSION_EXPIRY] = this.connection.session.expires;
          repoData[constants.AuthStorage.SESSION_SERVER_DATE] = this.connection.session.serverDate;
          authStorage.setAuthRepoData(repo, repoData);
        }
      }.bind(this));
    },
    _getQueryParams: function() {
      return clientLocation.getQueryParams();
    },
    _getHashParams: function() {
      return clientLocation.getHashParams();
    }
  });
  return CookieTokenAuthenticator;
});