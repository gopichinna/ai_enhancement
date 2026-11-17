/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/log", "csui/utils/url", "csui/utils/base", "csui/utils/user.session/expirationwarning.instance", "i18n!csui/utils/user.session/impl/nls/lang" ], function(module, require, _, $, log, Url, base, ExpirationWarningInstance, lang) {
  "use strict";
  log = log(module.id);
  var singleton = function() {
    log.info("user.session: module.config is: " + JSON.stringify(module.config())) && console.log(log.last);
    var DEFAULT_KINDNESS_PERIOD = 30 * 1e3;
    var DEFAULT_COOKIE_EXPIRATION_MODE = 1;
    var DEFAULT_ENABLE_EXPIRATION_HANDLING = false;
    var DEFAULT_SESSION_INACTIVITY_TIME = 27 * 60 * 1e3;
    var DEFAULT_SESSION_REACTION_TIME = 3 * 60 * 1e3;
    var MINIMUM_SESSION_INACTIVITY_TIME = 1 * 60 * 1e3;
    var MINIMUM_SESSION_REACTION_TIME = 2 * 60 * 1e3;
    var SERVER_TEST_ALIVE_INTERVAL = 15 * 1e3;
    var preExeced = false;
    var postExeced = false;
    var config = _.extend({
      signInPageUrl: "signin.html",
      kindnessPeriod: DEFAULT_KINDNESS_PERIOD,
      cookieExpirationMode: DEFAULT_COOKIE_EXPIRATION_MODE,
      enableExpirationHandling: DEFAULT_ENABLE_EXPIRATION_HANDLING
    }, module.config()), redirectEnabled = config.enableExpirationHandling == null ? DEFAULT_ENABLE_EXPIRATION_HANDLING : config.enableExpirationHandling, cookieExpirationMode = config.cookieExpirationMode == null ? DEFAULT_COOKIE_EXPIRATION_MODE : config.cookieExpirationMode, sessionInactivity = config.sessionInactivity == null ? DEFAULT_SESSION_INACTIVITY_TIME : config.sessionInactivity, sessionReactionTime = config.sessionReactionTime == null ? DEFAULT_SESSION_REACTION_TIME : config.sessionReactionTime, kindnessPeriod = config.kindnessPeriod == null ? DEFAULT_KINDNESS_PERIOD : config.kindnessPeriod, isCookieExpirationEnabled = cookieExpirationMode > 0;
    if (sessionInactivity < MINIMUM_SESSION_INACTIVITY_TIME) {
      log.warn("user.session: config: Timeout configuration error, 'timeout' value (= sessionInactivity) is less than minimum " + MINIMUM_SESSION_INACTIVITY_TIME / 1e3 / 60 + " minutes!") && console.warn(log.last);
    }
    if (sessionReactionTime < MINIMUM_SESSION_REACTION_TIME) {
      log.warn("user.session: config: Timeout configuration error, 'timeout alert' value (= sessionReactionTime) is less than minimum " + MINIMUM_SESSION_REACTION_TIME / 1e3 / 60 + " minutes!") && console.warn(log.last);
    }
    var usedConfig = {
      enableExpirationHandling: redirectEnabled,
      cookieExpirationMode: cookieExpirationMode,
      sessionInactivity: sessionInactivity,
      sessionReactionTime: sessionReactionTime,
      kindnessPeriod: kindnessPeriod
    };
    log.warn("user.session: used config: " + JSON.stringify(usedConfig)) && console.warn(log.last);
    var timerId;
    var logoutInitiated = false;
    var dlgResult = undefined;
    function getSessionReactionTime() {
      return sessionReactionTime;
    }
    function getSessionInactivity() {
      return sessionInactivity;
    }
    function isSessionExpirationEnabled() {
      return redirectEnabled;
    }
    function getCookieExpirationMode() {
      return cookieExpirationMode;
    }
    function currentDateUTC() {
      return new Date().toUTCString();
    }
    function _getOverallExpirationTime() {
      return getSessionInactivity() + getSessionReactionTime();
    }
    function _ensureExpiresTime(session) {
      if (session) {
        if (!session.expires || !session.serverDate) {
          var dat = new Date();
          session.serverDate = dat.toUTCString();
          session.expires = new Date(dat.getTime() + _getOverallExpirationTime()).toUTCString();
          log.warn("user.session: _ensureExpiresTime: Adding 'serverDate' and 'expires' information to session (expires: " + session.expires + ").") && console.warn(log.last);
        } else if (new Date(session.expires).getTime() <= new Date(session.serverDate).getTime()) {
          var dat2 = new Date();
          session.serverDate = dat2.toUTCString();
          session.expires = new Date(dat2.getTime() + _getOverallExpirationTime()).toUTCString();
          log.warn("user.session: _ensureExpiresTime: Provided 'serverDate' is newer or equal than 'expires' value, exceptionally replacing values (expires: " + session.expires + ").") && console.warn(log.last);
        }
      } else {
        log.error("user.session: _ensureExpiresTime: The provided argument 'session' is undefined!") && console.error(log.last);
      }
    }
    function _calcExpirationStartTime(authenticator) {
      var session = authenticator.connection.session;
      var diffTime = 0;
      _ensureExpiresTime(session);
      if (session && session.expires !== undefined && typeof session.expires === "string" && session.expires.length > 0) {
        var expireDate = new Date(session.expires);
        if (isNaN(expireDate.getTime())) {
          expireDate = new Date(new Date().getTime() + _getOverallExpirationTime());
          log.info("user.session: _calcExpirationStartTime: Got unparseable date value for expires '" + session.expires + "', using fallback value '" + expireDate.toUTCString() + "'.") && console.log(log.last);
          session.expires = expireDate.toUTCString();
        }
        var expireTime = expireDate.getTime();
        expireTime -= kindnessPeriod;
        if (expireTime < 0) {
          expireTime = 0;
        }
        var currentDate = new Date(session.serverDate);
        if (isNaN(currentDate.getTime())) {
          currentDate = new Date();
          log.warn("user.session: _calcExpirationStartTime: Got unparseable date value for serverDate '" + session.serverDate + "', using fallback value '" + currentDate.toUTCString() + "'.") && console.warn(log.last);
          session.serverDate = currentDate.toUTCString();
        }
        var currentTime = currentDate.getTime();
        log.info("user.session: _calcExpirationStartTime: srvDate: " + session.serverDate + ", expires: " + session.expires + " (Date: " + currentDateUTC() + ").") && console.log(log.last);
        if (currentTime >= expireTime) {
          diffTime = 0;
        } else {
          diffTime = expireTime - currentTime;
        }
        diffTime /= 1e3;
      } else {
        log.error("user.session: _calcExpirationStartTime: The provided authenticator.connection.session has no expiration information.") && console.error(log.last);
      }
      log.info("user.session: _calcExpirationStartTime: secs until expiration: " + diffTime) && console.log(log.last);
      return diffTime;
    }
    function _shouldDisplayExpirationWarning() {
      if (this.isSessionExpirationEnabled() === true && isCookieExpirationEnabled) {
        return this.getCookieExpirationMode() == 1;
      } else {
        return false;
      }
    }
    function reinitExpirationTimer(authenticator) {
      log.debug("user.session: reinitExpirationTimer: Reinit expiration timer at: " + this.currentDateUTC()) && console.log(log.last);
      this.clearExpirationTimer();
      this._createExpirationTimer(authenticator);
    }
    function updateSessionTicket(authenticator, request) {
      if (authenticator && authenticator.isAuthenticated()) {
        if (request && request.settings && request.settings.url) {
          var url = new Url(request.settings.url).getAbsolute().toLowerCase(), match = url.match(/^.*\/(api\/[^?]+)/);
          if (match) {
            var call = match[1];
            log.debug("user.session: updateSessionTicket: Resetting expiration timer based on call '" + call + "'.") && console.log(log.last);
            this.reinitExpirationTimer(authenticator);
          }
        } else {
          log.debug("user.session: updateSessionTicket: Resetting expiration timer based on unspecified call.") && console.log(log.last);
          this.reinitExpirationTimer(authenticator);
        }
      } else {
        log.warn("user.session: updateSessionTicket: Authenticator has to be 'authenticated' before updating session ticket!") && console.warn(log.last);
      }
    }
    function startExpirationTimer(authenticator) {
      if (authenticator && authenticator.isAuthenticated()) {
        log.debug("user.session: startExpirationTimer: Creating new expiration timer with provided authenticator...") && console.log(log.last);
        this.reinitExpirationTimer(authenticator);
      } else {
        console.warn("user.session: startExpirationTimer: Unable to start expiration timer, you have to provide an (still) authenticated 'authenticator'! Verify your parameter(s) for startExpirationTimer() function.");
      }
    }
    function clearExpirationTimer() {
      log.debug("user.session: clearExpirationTimer: called...") && console.log(log.last);
      if (timerId) {
        clearInterval(timerId);
        timerId = undefined;
      }
    }
    function _checkCurrentExpirationFromServer(authenticator) {
      this.getTicketExpires(authenticator, () => {
        log.debug("user.session: _checkCurrentExpirationFromServer: Session still alive (Date: " + currentDateUTC() + ")") && console.log(log.last);
      }, () => {
        if (ExpirationWarningInstance.isDisplayed()) {
          log.info("user.session: _checkCurrentExpirationFromServer: closing dialog due to failed call (Date: " + currentDateUTC() + ")") && console.log(log.last);
          ExpirationWarningInstance.closeDialog();
        }
      });
    }
    function checkAndHandleExpired(authenticator, timeVal, reactionTimeSecs, forceDialogUpdate = false) {
      log.info("user.session: checkAndHandleExpired: given timer value: " + timeVal + " (pre: " + preExeced + ", post: " + postExeced + ")") && console.log(log.last);
      if (timeVal < reactionTimeSecs) {
        log.debug("user.session: checkAndHandleExpired: current expiration value: " + timeVal) && console.log(log.last);
        if (timeVal > 0) {
          if (forceDialogUpdate && ExpirationWarningInstance.isDisplayed()) {
            log.info("user.session: checkAndHandleExpired: Forcing reset of timer value in dialog: " + timeVal + " (forceDialogUpdate: " + forceDialogUpdate + ")") && console.log(log.last);
            ExpirationWarningInstance.resetStartTime(timeVal);
          }
          if (postExeced) {
            ExpirationWarningInstance.resetStartTime(timeVal);
            postExeced = false;
          }
          if (!preExeced) {
            preExeced = true;
            postExeced = false;
            log.info("user.session: checkAndHandleExpired: get latest ticket expiration") && console.log(log.last);
            this.getTicketExpires(authenticator);
            if (!this._shouldDisplayExpirationWarning() && isCookieExpirationEnabled) {
              this.reinitExpirationTimer(authenticator);
            }
          }
          if (!ExpirationWarningInstance.isDisplayed()) {
            if (this._shouldDisplayExpirationWarning()) {
              log.info("user.session: checkAndHandleExpired: current time for expiration warning count down: " + currentDateUTC()) && console.log(log.last);
              this.displayExpirationWarning(authenticator, {
                startWithWarningContent: this.getCookieExpirationMode() === 1 ? true : false,
                startTime: timeVal
              }).then(function success(result) {
                log.info("user.session: checkAndHandleExpired: dialog reported closed by 'Continue session' (Date: " + currentDateUTC() + ")") && console.log(log.last);
              }, function failure(result) {
                if (result === false) {
                  log.info("user.session: checkAndHandleExpired: dialog reported closed by 'End session' (Date: " + currentDateUTC() + ")") && console.log(log.last);
                } else {
                  log.info("user.session: checkAndHandleExpired: dialog reported unhandled state 'undefined' (Date: " + currentDateUTC() + ")") && console.log(log.last);
                }
              });
            }
          }
        } else {
          log.info("user.session: checkAndHandleExpired: Ticket is expired based on timer...") && console.log(log.last);
          if (!postExeced) {
            log.info("user.session: checkAndHandleExpired: Get latest ticket expiration with already passed timer") && console.log(log.last);
            this.getTicketExpires(authenticator);
            preExeced = true;
            postExeced = true;
            this.reinitExpirationTimer(authenticator);
          } else {
            this.clearExpirationTimer();
            log.info("user.session: checkAndHandleExpired: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
            this.sendAuthenticatorEvent(authenticator);
            preExeced = false;
            postExeced = false;
            this.performSessionExpired(authenticator, false);
          }
        }
      } else {
        preExeced = false;
        postExeced = false;
        if (ExpirationWarningInstance.isDisplayed() === true) {
          this.clearExpirationTimer();
          log.info("user.session: checkAndHandleExpired: Expiration warning dialog is displayed, but timer is meanwhile not expired. Just closing the dialog.") && console.log(log.last);
          ExpirationWarningInstance.closeDialog();
          this.reinitExpirationTimer(authenticator);
        }
      }
    }
    function _adjustTimeCalculation(expectedEndTime, currTimer) {
      var nowTime = Date.now();
      var timeDiff = Math.floor((expectedEndTime - nowTime + 500) / 1e3);
      if (timeDiff < currTimer) {
        if (timeDiff > 0) {
          log.info("user.session: _adjustTimeCalculation: Adjusting timer value to actual time, using: " + timeDiff + " (currentTimer was: " + currTimer + ")") && console.log(log.last);
          currTimer = timeDiff;
        } else {
          var prevTimer = currTimer;
          currTimer = currTimer > 0 ? 0 : currTimer;
          log.info("user.session: _adjustTimeCalculation: Adjusting timer value to " + currTimer + ", diff was: " + timeDiff + " (currentTimer was: " + prevTimer + ")") && console.log(log.last);
        }
      }
      return currTimer;
    }
    function _createExpirationTimer(authenticator) {
      if (this.isSessionExpirationEnabled() === true) {
        var timeVal = _calcExpirationStartTime(authenticator);
        var self = this;
        var reactionTimeSecs = this.getSessionReactionTime() / 1e3;
        var expectedEndTime = Date.now() + timeVal * 1e3;
        var nextAliveCheckTime = Date.now() + SERVER_TEST_ALIVE_INTERVAL;
        timerId = setInterval(function() {
          log.debug("user.session: _createExpirationTimer: calling checkAndHandleExpired..., next alive check: " + nextAliveCheckTime) && console.log(log.last);
          --timeVal;
          if (Date.now() >= nextAliveCheckTime) {
            log.debug("user.session: _createExpirationTimer: initiating server alive check...") && console.log(log.last);
            self._checkCurrentExpirationFromServer(authenticator);
            nextAliveCheckTime = Date.now() + SERVER_TEST_ALIVE_INTERVAL;
          }
          var prevTimeout = timeVal;
          var forceDialogUpdate = false;
          timeVal = self._adjustTimeCalculation(expectedEndTime, prevTimeout);
          if (timeVal != prevTimeout && timeVal >= 0) {
            forceDialogUpdate = true;
          }
          self.checkAndHandleExpired(authenticator, timeVal, reactionTimeSecs, forceDialogUpdate);
        }, 1e3);
      } else {
        log.debug("user.session: _createExpirationTimer: skipping creating timer due to disabled session expiration handling...") && console.log(log.last);
      }
    }
    function stopExpirationWarningViewTimer() {
      log.info("user.session: stopExpirationWarningViewTimer: triggering clear timer from external source...") && console.info(log.last);
      ExpirationWarningInstance.triggerClearTimer();
    }
    function _showExpirationWarningDialog(authenticator, options) {
      var self = this;
      var dlgOptions = {
        userSession: self,
        authenticator: authenticator,
        startWithWarningContent: options.startWithWarningContent,
        startTime: options.startTime,
        clearExpirationTimer: function() {
          self.clearExpirationTimer();
        },
        closeDialog: function() {
          ExpirationWarningInstance.closeDialog();
        }
      };
      return ExpirationWarningInstance.showExpirationWarningDialog(dlgOptions);
    }
    function closeExpirationWarningDialog() {
      if (ExpirationWarningInstance && ExpirationWarningInstance.isDisplayed() === true) {
        log.info("user.session: closeExpirationWarningDialog: Expiration warning dialog is displayed and will be closed.") && console.log(log.last);
        ExpirationWarningInstance.closeDialog();
      }
    }
    function displayExpirationWarning(authenticator, options) {
      log.info("user.session: displayExpirationWarning: got into...") && console.log(log.last);
      if (this.isSessionExpirationEnabled() === true && this._shouldDisplayExpirationWarning()) {
        log.info("user.session: displayExpirationWarning: expiration warning is displayed: " + ExpirationWarningInstance.isDisplayed()) && console.log(log.last);
        if (ExpirationWarningInstance.isDisplayed() === false) {
          if (options && options.startWithWarningContent === true) {
            dlgResult = this._showExpirationWarningDialog(authenticator, options);
            return dlgResult;
          }
        }
        return dlgResult;
      }
    }
    function redirectToTargetPage(authenticator) {
      log.debug("user.session: redirectToTargetPage: Called ...") && console.log(log.last);
      var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
      var targetUrl = Url.appendQuery(cgiUrl, "func=csui.redirecttotarget");
      location.href = targetUrl;
    }
    function performSessionExpired(authenticator, doRedirect) {
      var self = this;
      if (this.isSessionExpirationEnabled() === true) {
        if (!logoutInitiated) {
          logoutInitiated = true;
          log.debug("user.session: performSessionExpired: Initiating automatic logout ...") && console.log(log.last);
          this.clearExpirationTimer();
          if (doRedirect === true) {
            log.info("user.session: performSessionExpired: Session expired, performing requested redirect (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
            this.redirectToTargetPage(authenticator);
          } else {
            log.info("user.session: performSessionExpired: Session expired, performing signOut (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
            this.signOut(authenticator, {
              onErrorRedirect: true,
              isSessionExpired: true
            }).done(function() {
              logoutInitiated = false;
              log.debug("user.session: performSessionExpired: Automatic logout requests successfully sent.") && console.log(log.last);
            }).fail(function() {
              logoutInitiated = false;
              log.info("user.session: performSessionExpired: Sending automatic logout requests returned error.") && console.log(log.last);
            }).always(function() {
              log.info("user.session: performSessionExpired: Sending automatic logout requests finished, spawning redirect timer.") && console.log(log.last);
              var timerRedirectId = setTimeout(function() {
                logoutInitiated = false;
                if (timerRedirectId) {
                  clearTimeout(timerRedirectId);
                  timerRedirectId = undefined;
                }
                log.info("user.session: performSessionExpired: Redirecting to target page...'") && console.log(log.last);
                self.redirectToTargetPage(authenticator);
              }, kindnessPeriod);
            });
          }
        } else {
          log.debug("user.session: performSessionExpired: A logout is already executed.") && console.log(log.last);
        }
      } else {
        log.debug("user.session: performSessionExpired: Skipping automatic logout due to disabled expiration handling.") && console.log(log.last);
        this.clearExpirationTimer();
      }
    }
    function getTicketExpires(authenticator, successFct = undefined, failureFct = undefined) {
      var self = this;
      var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
      var messagesUrl = Url.combine(cgiUrl, "api/v2/messages/status");
      authenticator.makeAjaxCall({
        url: messagesUrl,
        headers: {
          OTCSTicket: authenticator.connection.session.ticket
        },
        success: function(response, textStatus, request) {
          log.debug("user.session: getTicketExpires: Receiving request response from {0}, textStatus: {1}", messagesUrl, textStatus) && console.log(log.last);
          response = authenticator.parseResponse(response, request);
          authenticator.updateAuthenticatedSession(response, request);
        }
      }).done(function() {
        self.startExpirationTimer(authenticator);
        if (successFct) {
          successFct();
        }
        log.info("user.session: getTicketExpires: Processed get ticket expires (currentDate: " + self.currentDateUTC() + ", expires: " + authenticator.connection.session.expires + ").") && console.log(log.last);
      }).fail(function(req) {
        if (failureFct) {
          failureFct();
        }
        self.sendAuthenticatorEvent(authenticator, "expired");
        var errDetails = new base.RequestErrorMessage(req);
        var errResponse = lang.errorHttpPrefix + " " + errDetails.statusCode + (errDetails.message ? ": " : "") + errDetails.message;
        log.warn("user.session: getTicketExpires: Processing get ticket expires failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.warn(log.last);
        self.redirectToTargetPage(authenticator);
      });
    }
    function continueSession(authenticator) {
      var self = this;
      var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
      var authUrl = Url.combine(cgiUrl, "api/v1/auth");
      authenticator.makeAjaxCall({
        url: authUrl,
        headers: {
          OTCSTicket: authenticator.connection.session.ticket
        },
        success: function(response, textStatus, request) {
          log.debug("user.session: continueSession: Receiving request response from {0}.", authUrl) && console.log(log.last);
          response = authenticator.parseResponse(response, request);
          authenticator.updateAuthenticatedSession(response, request);
        }
      }).done(function() {
        self.startExpirationTimer(authenticator);
        log.info("user.session: continueSession: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
      }).fail(function(req) {
        self.sendAuthenticatorEvent(authenticator, "failedTicketRefresh");
        var errMsg = lang.errorContinueSession;
        var errDetails = new base.RequestErrorMessage(req);
        var errResponse = lang.errorHttpPrefix + " " + errDetails.statusCode + (errDetails.message ? ": " : "") + errDetails.message;
        log.error("user.session: continueSession: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
        require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlert) {
          ModalAlert.showError(errMsg + "\n" + errResponse).always(function() {
            self.redirectToTargetPage(authenticator);
          });
        });
      });
    }
    function sendAuthenticatorEvent(authenticator, reasonStr) {
      if (authenticator) {
        authenticator.trigger(reasonStr || "loggedOut", {
          sender: authenticator
        });
      }
    }
    function signOut(authenticator, cmdData) {
      var deferred = $.Deferred();
      var self = this;
      cmdData || (cmdData = {});
      if (authenticator && authenticator.isAuthenticated()) {
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        require([ "csui/utils/routing", "csui/utils/open.authenticated.page" ], function(routing, openAuthenticatedPage) {
          if (routing.routesWithSlashes()) {
            if (self.isSessionExpirationEnabled() === true) {
              if (authenticator && authenticator.makeAjaxCall && typeof authenticator.makeAjaxCall === "function") {
                var tokenUrl = Url.combine(cgiUrl, "api/v1/auth/logouttoken");
                authenticator.makeAjaxCall({
                  url: tokenUrl,
                  headers: {
                    OTCSTicket: authenticator.connection.session.ticket
                  },
                  success: function(response, textStatus, request) {
                    log.debug("Receiving request response from {0}.", tokenUrl) && console.log(log.last);
                    response = authenticator.parseResponse(response, request);
                    authenticator.updateAuthenticatedSession(response, request);
                  }
                }).then(function(response) {
                  var queryStr = "func=csui.dologout&secureRequestToken=" + encodeURIComponent(response.token);
                  if (cmdData.isSessionExpired === true) {
                    queryStr += "&authcontext=sessionexpired";
                  }
                  var logoutFct = Url.appendQuery(cgiUrl, queryStr);
                  openAuthenticatedPage(authenticator.connection, logoutFct, {
                    openInNewTab: false
                  }).always(function() {
                    authenticator.unauthenticate(cmdData.unauthenticateReason || {
                      reason: "logged-out"
                    });
                    log.debug("user.session: signOut: The logout request was sent to server (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                    deferred.resolve();
                  });
                }, function(req) {
                  var errMsg = lang.errorTerminateSession;
                  var errDetails = new base.RequestErrorMessage(req);
                  var errResponse = lang.errorHttpPrefix + " " + errDetails.statusCode + (errDetails.message ? ": " : "") + errDetails.message;
                  if (cmdData.onErrorRedirect === true) {
                    authenticator.unauthenticate(cmdData.unauthenticateReason || {
                      reason: "logged-out"
                    });
                    log.info("user.session: signOut: Terminate session was not successful, redirecting ... (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                    self.redirectToTargetPage(authenticator);
                  } else {
                    log.error("user.session: signOut: Terminate session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                    require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlert) {
                      ModalAlert.showError(errMsg + "\n" + errResponse).always(function() {
                        authenticator.unauthenticate(cmdData.unauthenticateReason || {
                          reason: "logged-out"
                        });
                        self.redirectToTargetPage(authenticator);
                      });
                    });
                  }
                  deferred.reject(req);
                });
              } else {
                authenticator.unauthenticate(cmdData.unauthenticateReason || {
                  reason: "logged-out"
                });
                log.debug("user.session: signOut: makeAjaxCall is not available, so performing redirect to target page (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                self.redirectToTargetPage(authenticator);
                deferred.resolve();
              }
            } else {
              log.debug("user.session: signOut: Session expiration handling is disabled, skipping logout (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
              deferred.resolve();
            }
          } else {
            authenticator.unauthenticate(cmdData.unauthenticateReason || {
              reason: "logged-out"
            });
            var signInPageUrl = config.signInPageUrl, query = location.search;
            query += query ? "&" : "?";
            query += "nextUrl=" + encodeURIComponent(location.pathname);
            var logoutUrl = signInPageUrl + query + location.hash;
            log.debug("user.session: signOut: Performed unauthenticate with redirect to development signIn page.") && console.log(log.last);
            location.href = logoutUrl;
            deferred.resolve();
          }
        });
      } else {
        log.info("user.session: signOut: Authenticator is not 'authenticated' anymore, just returning success.") && console.log(log.last);
        deferred.resolve();
      }
      return deferred.promise();
    }
    return {
      getSessionReactionTime: getSessionReactionTime,
      getSessionInactivity: getSessionInactivity,
      isSessionExpirationEnabled: isSessionExpirationEnabled,
      getCookieExpirationMode: getCookieExpirationMode,
      currentDateUTC: currentDateUTC,
      signOut: signOut,
      continueSession: continueSession,
      getTicketExpires: getTicketExpires,
      redirectToTargetPage: redirectToTargetPage,
      closeExpirationWarningDialog: closeExpirationWarningDialog,
      updateSessionTicket: updateSessionTicket,
      startExpirationTimer: startExpirationTimer,
      displayExpirationWarning: displayExpirationWarning,
      performSessionExpired: performSessionExpired,
      clearExpirationTimer: clearExpirationTimer,
      stopExpirationWarningViewTimer: stopExpirationWarningViewTimer,
      sendAuthenticatorEvent: sendAuthenticatorEvent,
      reinitExpirationTimer: reinitExpirationTimer,
      checkAndHandleExpired: checkAndHandleExpired,
      _createExpirationTimer: _createExpirationTimer,
      _shouldDisplayExpirationWarning: _shouldDisplayExpirationWarning,
      _adjustTimeCalculation: _adjustTimeCalculation,
      _showExpirationWarningDialog: _showExpirationWarningDialog,
      _checkCurrentExpirationFromServer: _checkCurrentExpirationFromServer
    };
  };
  return singleton();
});