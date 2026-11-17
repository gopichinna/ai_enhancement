/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "nuc/contexts/factories/connector", "nuc/utils/url", "smart/controls/globalmessage/globalmessage", "smart/dialogs/modal.alert/modal.alert", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/utils/non-emptying.region/non-emptying.region", "dctmw/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "dctmw/utils/authenticators/session", "i18n!dctmw/dialogs/authentication/impl/nls/lang", "hbs!dctmw/dialogs/authentication/impl/core.login.dialog", "css!dctmw/dialogs/authentication/impl/core.login.dialog" ], function($, Marionette, ConnectorFactory, Url, GlobalMessage, ModalAlert, TabablesBehavior, NonEmptyingRegion, RestLinkrels, RestResources, utils, Session, lang, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "dctm-core-login-dialog cs-dialog binf-modal binf-fade",
    template: template,
    attributes: {
      tabindex: "-1",
      role: "dialog",
      "aria-hidden": "true"
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    ui: {
      header: ".binf-modal-header",
      body: ".binf-modal-body"
    },
    events: {
      "hidden.binf.modal": "onHidden",
      "click .cs-close": "onClickClose",
      keyup: "onKeyInView"
    },
    templateHelpers: function() {
      return {
        coreAuthUrl: this.coreAuthUrl,
        title: lang.CoreLoginDialogTitle,
        closeTooltip: lang.CoreLoginDialogCloseBtn
      };
    },
    constructor: function CoreLoginDialog(options) {
      options = options || {};
      options.connector = Session.get().getContext().getObject(ConnectorFactory);
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenToOnce(this, "before:hide", TabablesBehavior.popTabableHandler);
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27) {
        this.destroy();
      } else if ((event.keyCode === 13 || event.keyCode === 32) && $(event.target).closest(".cs-close").length > 0) {
        this.destroy();
      }
    },
    setCurrentTabFocus: function() {
      this.focusOnLastRegion = true;
      this.$el.trigger("focus");
    },
    tabNextRegion: function() {
      this.trigger("changed:focus");
    },
    login: function() {
      var me = this, currRepo = RestResources.getCurrentRepository();
      me.deferred = $.Deferred();
      $.ajax(me.options.connector.extendAjaxOptions({
        url: Url.combine(RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.SELF), "d2-core-auth-checker"),
        success: function() {
          me.deferred.resolve();
        },
        error: function(request, textStatus, error) {
          if (request.status === 403) {
            me.coreAuthUrl = request.getResponseHeader("Location");
            if (!me.coreAuthUrl) {
              me.deferred.reject(utils.parseAjaxErrorAsString(request, textStatus, error));
              return;
            }
            me._checkCoreLogin().fail(function() {
              var coreConfig = RestResources.getD2Options().core_share_configurations;
              if (!coreConfig || coreConfig.allow_within_iframe !== false) {
                var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
                  el: container
                });
                region.show(me);
                me._attachMessageListener(me.destroy.bind(me));
              } else {
                me._externalWnd = me._openWindow(me.coreAuthUrl);
                if (!me._externalWnd) {
                  ModalAlert.showWarning(function() {
                    me.deferred.reject();
                  }, lang.CoreExternalLoginDialogPopupWarning, lang.CoreExternalLoginDialogPopupTitle);
                } else {
                  var wndChecker = function() {
                    if (me.deferred.state() === "pending") {
                      if (!me._externalWnd || me._externalWnd.closed) {
                        window.removeEventListener("message", me._msgListener);
                        me._modalMessage && me._modalMessage.close();
                        me.deferred.reject();
                      } else {
                        setTimeout(wndChecker, 250);
                      }
                    }
                  };
                  setTimeout(wndChecker, 250);
                  me._attachMessageListener(function() {
                    GlobalMessage.showMessage("error", lang.CoreExternalLoginDialogAuthError);
                    me.destroy();
                  });
                  me._modalMessage = ModalAlert.showInformation(function() {
                    window.removeEventListener("message", me._msgListener);
                    me._externalWnd && me._externalWnd.close();
                    me.deferred.reject();
                  }, lang.CoreExternalLoginDialogMessage, lang.CoreExternalLoginDialogTitle, {
                    buttons: {
                      showYes: false,
                      showNo: false,
                      showCancel: true,
                      labelCancel: lang.CoreExternalLoginDialogCancelBtn
                    }
                  });
                }
              }
            });
          } else {
            me.deferred.reject(utils.parseAjaxErrorAsString(request, textStatus, error));
          }
        }
      }));
      return me.deferred.promise();
    },
    _checkCoreLogin: function() {
      var me = this, deferred = $.Deferred(), offScrFrame = $('<iframe id="dctm_core_login_check">').css({
        position: "absolute",
        width: "1px",
        height: "1px",
        left: "-1px"
      }).attr("src", me.coreAuthUrl + "&prompt=none");
      this._attachMessageListener(function() {
        deferred.reject();
      });
      $("body").append(offScrFrame);
      return deferred.promise();
    },
    _attachMessageListener: function(errCb) {
      var me = this;
      me._msgListener = function(e) {
        window.removeEventListener("message", me._msgListener);
        $("#dctm_core_login_check").remove();
        me._externalWnd && me._externalWnd.close();
        me._modalMessage && me._modalMessage.close();
        var data = e.message || e.data;
        if (data === "AUTH_SUCCESS") {
          me.deferred.resolve();
          me.destroy(true);
        } else if (data === "AUTH_ERROR") {
          errCb();
        }
      };
      window.addEventListener("message", me._msgListener, false);
    },
    _openWindow: function(url) {
      var height = Math.min(Math.max(window.outerHeight - 200, 500), 800), width = Math.min(Math.max(window.outerWidth - 150, 700), 1e3);
      return window.open(url, "dctm_core_login_dialog", "scrollbars=yes,resizable=yes" + ",height=" + height + ",width=" + width + ",top=" + (window.screenTop + (window.outerHeight - height) / 2) + ",left=" + (window.screenLeft + (window.outerWidth - width) / 2));
    },
    onRender: function() {
      this.$el.attr("tabindex", 0);
    },
    onShow: function() {
      var me = this;
      $(window).scrollTop(0);
      me.$el.binf_modal({
        backdrop: "static",
        keyboard: false,
        paddingWhenOverflowing: false
      });
    },
    onHidden: function() {
      this.destroy();
    },
    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
    },
    destroy: function(isSuccess) {
      if (this.$el.is(":visible")) {
        this.$el.binf_modal("hide");
      }
      if (isSuccess !== true) {
        this.deferred.reject();
      }
      Marionette.LayoutView.prototype.destroy.apply(this, arguments);
      return this;
    }
  });
});