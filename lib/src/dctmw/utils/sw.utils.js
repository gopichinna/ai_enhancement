/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/log", "dctmw/utils/client.location", "css!dctmw/ctf/ctf" ], function(module, _, $, log, clientLocation) {
  "use strict";
  log = log(module.id);
  var config = _.extend({}, module.config()), enabled = false, selfId, $elUpdateBannerContainer, $elUpdateNotification, reloadPending = false;
  function preReqCheck() {
    return navigator.serviceWorker && navigator.serviceWorker.controller;
  }
  function isEnabled() {
    return preReqCheck() && !!selfId && enabled === true;
  }
  function initialize() {
    var dfd = $.Deferred(), tId;
    if (preReqCheck()) {
      navigator.serviceWorker.addEventListener("message", function(event) {
        log.debug('[SW] Incoming message "' + event.data.type + '" at ' + new Date().getTime()) && console.log(log.last);
        if (event.data.type === "init") {
          selfId = event.data.clientId;
          enabled = event.data.enabled;
          if (tId) {
            clearTimeout(tId);
          }
          enabled ? dfd.resolve() : dfd.reject("disabled");
        } else {
          handleControllerEvent(event);
        }
      });
      var baseContextPath = config.connection.url;
      if (baseContextPath.startsWith("http")) {
        baseContextPath = "/" + baseContextPath.split("/")[3];
      }
      navigator.serviceWorker.controller.postMessage({
        type: "init",
        dynamicBasePath: baseContextPath
      });
      log.debug("[SW} Init request sent at " + new Date().getTime()) && console.log(log.last);
      tId = setTimeout(function() {
        if (!enabled) {
          dfd.reject("disabled");
        }
      }, 1500);
    } else {
      dfd.reject("unsupported");
    }
    dfd.fail(function(e) {
      log.warn('[SW] Not running due to "' + e + '"') && console.warn(log.last);
    });
    return dfd.promise();
  }
  function handleControllerEvent(event) {
    if (event.data.clientId === selfId) {
      switch (event.data.type) {
       case "unauthorized":
        log.warn("[SW] Unauthorized.") && console.warn(log.last);
        require([ "nuc/contexts/factories/factory", "dctmw/utils/authenticators/session" ], function(ConnectorFactory, Session) {
          var context = Session.get().getContext(), connector = context.getObject(ConnectorFactory);
          connector && connector.authenticator && connector.authenticator.unauthenticate({
            reason: "expired"
          });
        });
        break;

       case "app_update_pending":
        require([ "dctmw/utils/authenticators/session" ], function(Session) {
          var session = Session.get(), handleMessage = function() {
            if (!reloadPending) {
              showUpdateAvailableBanner();
            }
          };
          if (session.isInitialized()) {
            handleMessage();
          } else {
            session.once("init", handleMessage);
          }
        });
        break;

       case "app_update_settled":
        require([ "dctmw/utils/authenticators/session", "i18n!dctmw/utils/nls/lang" ], function(Session, lang) {
          var session = Session.get(), handleMessage = function() {
            reloadPending = true;
            hideUpdateAvailableBanner();
            session.trigger("error", {
              errorMsg: lang.msgUpdateInstalled,
              showPageReloadButton: true
            });
          };
          if (session.isInitialized()) {
            handleMessage();
          } else {
            session.once("init", handleMessage);
          }
        });
        break;
      }
    }
  }
  function hideUpdateAvailableBanner() {
    $elUpdateNotification && $elUpdateNotification.detach();
    $elUpdateNotification && $elUpdateBannerContainer.removeClass("pushBodyDown");
  }
  function showUpdateAvailableBanner() {
    require([ "i18n!dctmw/utils/nls/lang" ], function(lang) {
      if (!$elUpdateNotification) {
        $elUpdateBannerContainer = $("body > div.binf-widgets");
        $elUpdateNotification = $("<div/>", {
          id: "ctfmain",
          class: "ctfmain"
        });
        var $note = $("<div/>", {
          id: "extensionNotification",
          class: "note"
        });
        $elUpdateNotification.append($note);
        var $messageLabelDiv = $("<div/>", {
          id: "messageLabelDiv",
          class: "messageLabel"
        });
        $messageLabelDiv.html("  " + _.str.sformat(lang.msgUpdateAvailable, _.str.sformat('<a class="reloadLink">{0}</a>', lang.labelReloadLink)));
        $messageLabelDiv.find(">.reloadLink").on("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          clientLocation.reload();
        });
        var $buttonContainer = $("<div/>", {
          id: "buttonContainerDiv",
          class: "buttonContainer"
        });
        var $btnDismiss = $("<a>", {
          class: "button"
        }).append($("<span>", {
          class: "buttonCaption"
        }).text(lang.labelBannerDismissButton));
        $btnDismiss.appendTo($buttonContainer).on("click", hideUpdateAvailableBanner);
        $note.append($messageLabelDiv);
        $note.append($buttonContainer);
      }
      $elUpdateBannerContainer.addClass("pushBodyDown").append($elUpdateNotification);
    });
  }
  function setCacheAccessContext(contextData) {
    isEnabled() && navigator.serviceWorker.controller.postMessage({
      type: "cache_access_context",
      contextData: contextData
    });
  }
  return {
    isEnabled: isEnabled,
    initialize: initialize,
    setCacheAccessContext: setCacheAccessContext
  };
});