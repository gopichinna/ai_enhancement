/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/contexts/factories/connector", "nuc/utils/log", "csui/utils/user.session/user.session", "csui/utils/expiration.warning/expiration.warning.dialog", "nuc/utils/base", "dctmw/commands/sign.out", "dctmw/utils/rest.resources", "dctmw/utils/authenticators/session", "dctmw/utils/utils", "i18n!dctmw/overrides/csui/utils/impl/nls/lang" ], function(require, _, $, ConnectorFactory, log, UserSession, ExpirationWarningInstance, base, SignOut, RestResources, Session, Utils, lang) {
  "use strict";
  _.extend(UserSession, {
    signOut: function() {
      var deferred = $.Deferred();
      var status = {
        context: Session.get().getContext()
      };
      var command = new SignOut();
      command.execute(status).done(function(data) {
        deferred.resolve(data);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    continueSession: function(authenticator) {
      var self = this;
      var context = Session.get().getContext();
      var connector = context.getObject(ConnectorFactory);
      var headers = {
        "DOCUMENTUM-CUSTOM-UNAUTH-SCHEME": true,
        "DOCUMENTUM-NO-SAML2-REDIRECT": true
      };
      var options = {
        credentials: {
          repositoryName: RestResources.getCurrentRepository().get("name")
        }
      };
      var authUrl = authenticator.getAuthUrl(options);
      $.ajax(connector.extendAjaxOptions({
        url: authUrl,
        skipSWCache: true,
        headers: headers,
        success: function(response, textStatus, request) {
          log.debug("Receiving request response from {0}.", authUrl) && console.log(log.last);
          authenticator.updateAuthenticatedSession(response, request);
        }
      })).done(function() {
        self.startExpirationTimer(authenticator);
        log.info("expiration.warning.dialog: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
      }).fail(function(req) {
        self.sendAuthenticatorEvent(authenticator, "failedTicketRefresh");
        var errMsg = lang.errorContinueSession;
        var errDetails = Utils.parseAjaxError(req);
        var errResponse = lang.errorHttpPrefix + " " + errDetails.statusCode + (errDetails.message ? ": " : "") + errDetails.message;
        log.error("expiration.warning.dialog: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
        require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlert) {
          ModalAlert.showError(errMsg + "\n" + errResponse).always(function() {
            self.redirectToTargetPage(authenticator);
          });
        });
      });
    },
    redirectToTargetPage: function() {},
    sendAuthenticatorEvent: function(authenticator, reasonStr) {
      if (authenticator) {
        authenticator.trigger(reasonStr || "loggedOut", {
          sender: authenticator,
          reason: "logged-out"
        });
      }
    },
    checkAndHandleExpired: function(authenticator, timer, reactionTimeSecs) {
      var me = this;
      if (timer < reactionTimeSecs) {
        log.debug("user.session: checkAndHandleExpired: current expiration value: " + timer) && console.log(log.last);
        if (timer > 0) {
          if (!ExpirationWarningInstance.isDisplayed()) {
            if (this._shouldDisplayExpirationWarning()) {
              log.info("user.session: checkAndHandleExpired: current time for expiration warning count down: " + me.currentDateUTC()) && console.log(log.last);
              this.displayExpirationWarning(authenticator, {
                startWithWarningContent: this.getCookieExpirationMode() === 1,
                startTime: timer
              }).then(function success() {
                log.info("user.session: checkAndHandleExpired: dialog reported closed by 'Continue session' (Date: " + me.currentDateUTC() + ")") && console.log(log.last);
              }, function failure(result) {
                if (result === false) {
                  log.info("user.session: checkAndHandleExpired: dialog reported closed by 'End session' (Date: " + me.currentDateUTC() + ")") && console.log(log.last);
                } else {
                  log.info("user.session: checkAndHandleExpired: dialog reported unhandled state 'undefined' (Date: " + me.currentDateUTC() + ")") && console.log(log.last);
                }
              });
            }
          }
        } else {
          log.info("user.session: checkAndHandleExpired: Ticket is expired based on timer...") && console.log(log.last);
          this.clearExpirationTimer();
          log.info("user.session: checkAndHandleExpired: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
          this.sendAuthenticatorEvent(authenticator);
          ExpirationWarningInstance.closeDialog();
          this.performSessionExpired(authenticator, false);
        }
      } else {
        if (ExpirationWarningInstance.isDisplayed() === true) {
          this.clearExpirationTimer();
          log.info("user.session: checkAndHandleExpired: Expiration warning dialog is displayed, but timer is meanwhile not expired. Just closing the dialog.") && console.log(log.last);
          ExpirationWarningInstance.closeDialog();
          this.reinitExpirationTimer(authenticator);
        }
      }
    },
    currentDateUTC: function() {
      return new Date().toUTCString();
    },
    getTicketExpires: function() {}
  });
});