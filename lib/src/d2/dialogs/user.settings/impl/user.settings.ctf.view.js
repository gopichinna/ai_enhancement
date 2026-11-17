/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/controls/form/fields/booleanfield.view", "i18n", "d2/utils/constants", "dctmw/utils/utils", "d2/ctf/constants", "d2/ctf/utils", "d2/ctf/ctfBridge", "d2/ctf/wsHandler", "d2/controls/form/fields/d2ctfpathfield.view", "hbs!d2/dialogs/user.settings/impl/user.settings.ctf", "i18n!d2/dialogs/user.settings/impl/nls/lang", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, base, PubSub, BlockingView, ToggleSwitchView, i18n, constants, utils, ctfConstants, ctfUtils, ctfBridge, wshandler, D2CtfPathFieldView, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    constructor: function UserSettingsCTFView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.parentView = this.options.parentView;
      this.browserPluginModes = ctfUtils.getBrowserPluginModes();
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
      PubSub.on("user:preference:browser:plugin:update", this.onBrowserPluginModeUpdate.bind(this));
    },
    className: "user-settings-ctf",
    template: template,
    ui: {
      addonContainer: ".addon-container",
      addonEnableSwitchContainer: ".addon-enable.toggle-switch-container",
      addonEnableSwitch: ".addon-enable-switch",
      currentversionContainer: ".current-version-container",
      currentversionDetails: ".current-version-details",
      addonInstallerContainer: ".addon-installer-container",
      addonInstallerButton: ".addon-installer-button",
      addonUpgradeInstallerButton: ".addon-upgrade-installer-button",
      addonUpgradeInstallerContainer: ".addon-upgrade-installer-container",
      locationPathContainer: ".location-path-container",
      temporaryPathContainer: ".temporary-path-container",
      checkoutPathContainer: ".checkout-path-container",
      dotsLoader: ".dots-loader"
    },
    regions: {
      addonEnableSwitchRegion: ".addon-enable-switch",
      temporaryPathFieldRegion: ".temporary-path-field",
      checkoutPathFieldRegion: ".checkout-path-field"
    },
    events: {
      "click @ui.addonInstallerButton": "_onClickAddonInstallerButton",
      "keydown @ui.addonInstallerButton": "_onKeyDownAddonInstallerButton",
      "click @ui.addonUpgradeInstallerButton": "_onClickAddonInstallerButton",
      "keydown @ui.addonUpgradeInstallerButton": "_onKeyDownAddonInstallerButton"
    },
    templateHelpers: function() {
      return {
        addonHeader: lang.addonHeader,
        addonDescription: lang.addonDescription,
        currentVersionLabel: lang.currentVersionLabel,
        addonEnableLabel: lang.addonEnableLabel,
        downloadTitle: lang.downloadTitle,
        downloadAria: lang.downloadAria,
        downloadLabel: lang.downloadLabel,
        addonInstallerLabel: lang.addonInstallerLabel,
        addonUpgradeInstallerLabel: lang.addonUpgradeInstallerLabel,
        locationPathHeader: lang.locationPathHeader,
        locationPathDescription: lang.locationPathDescription,
        temporaryPathLabel: lang.temporaryPathLabel,
        checkoutPathLabel: lang.checkoutPathLabel
      };
    },
    onRender: function() {
      this.checkBrowserPluginModeSettings();
    },
    onDestroy: function() {
      PubSub.off("user:preference:browser:plugin:update");
    },
    getBrowserPluginMode: function() {
      var browserPluginMode = constants.BrowserPluginMode.THIN, savedBrowserPluginMode = this.parentView.getPreferenceValue("sv_browser_plugin_mode");
      if (_.isArray(this.browserPluginModes) && this.browserPluginModes.length > 0) {
        if (this.browserPluginModes.length === 1 || !savedBrowserPluginMode) {
          browserPluginMode = this.browserPluginModes[0];
        } else {
          browserPluginMode = savedBrowserPluginMode;
        }
      }
      return browserPluginMode;
    },
    checkBrowserPluginModeSettings: function() {
      var browserPluginMode = this.getBrowserPluginMode();
      if (_.isArray(this.browserPluginModes) && _.contains(this.browserPluginModes, constants.BrowserPluginMode.WSCTF) && ctfUtils.isCtfEnabledForDevice()) {
        var switchData = browserPluginMode === constants.BrowserPluginMode.WSCTF;
        this.createAddonEnableSwich(switchData);
        if (this.browserPluginModes.length === 1) {
          this.ui.addonEnableSwitchContainer.addClass("binf-hidden");
        }
      } else {
        this.$el.addClass("binf-hidden");
      }
    },
    checkWsctfStatus: function() {
      var self = this, dfd = $.Deferred();
      if (ctfBridge.getStatus() === ctfConstants.Status.TRYING) {
        self.ui.dotsLoader.removeClass("binf-hidden");
        var pollInterval = setInterval(function() {
          if (ctfBridge.getStatus() !== ctfConstants.Status.TRYING || self.getBrowserPluginMode() !== constants.BrowserPluginMode.WSCTF) {
            dfd.resolve(ctfBridge.getStatus());
            self.ui.dotsLoader.addClass("binf-hidden");
            clearInterval(pollInterval);
          }
        }, 500);
      } else {
        dfd.resolve(ctfBridge.getStatus());
      }
      return dfd.promise();
    },
    onBrowserPluginModeUpdate: function(browserPluginMode) {
      if (!_.isArray(this.browserPluginModes) || this.browserPluginModes.length > 1 || !_.contains(this.browserPluginModes, constants.BrowserPluginMode.WSCTF)) {
        if (browserPluginMode === constants.BrowserPluginMode.THIN) {
          this.addonEnableSwichView.model.set("data", false, {
            silent: true
          });
          this.addonEnableSwichView.render();
          this.manageElementsBasedOnFlag(false, this.addonEnableSwichView);
        }
      }
    },
    createAddonEnableSwich: function(switchData) {
      var self = this, addonEnableSwichModel = new Backbone.Model({
        data: switchData
      });
      this.addonEnableSwichView = new ToggleSwitchView({
        id: _.uniqueId("addon_enable_toggle"),
        model: addonEnableSwichModel
      });
      this.addonEnableSwitchRegion.show(this.addonEnableSwichView);
      this.manageElementsBasedOnFlag(switchData, this.addonEnableSwichView);
      this.listenTo(addonEnableSwichModel, "change:data", function(model, value) {
        self.onAddonEnableSwitchChange(model, value, this.addonEnableSwichView);
      });
    },
    onAddonEnableSwitchChange: function(model, value, toggleView) {
      var self = this;
      var preference = {
        sv_browser_plugin_mode: constants.BrowserPluginMode.THIN
      };
      if (value) {
        preference["sv_browser_plugin_mode"] = constants.BrowserPluginMode.WSCTF;
      }
      var $checkbox = toggleView.$el.find(".binf-switch-container input[type=checkbox]");
      $checkbox.prop("disabled", true);
      self.blockActions();
      self.parentView.hideErrorMessage(toggleView.$el.closest(".toggle-switch-container"));
      self.parentView.updateUserSettings(preference, this.options).done(function() {
        self.unblockActions();
        $checkbox.prop("disabled", false);
        $checkbox[0] && $checkbox[0].focus();
        self.manageElementsBasedOnFlag(value, toggleView);
      }).fail(function(error) {
        self.unblockActions();
        $checkbox.prop("disabled", false);
        $checkbox[0] && $checkbox[0].focus();
        var errorMessage = lang.addonEnableError;
        if (error && error.message) {
          errorMessage = error.message;
        }
        self.parentView.showErrorMessage(errorMessage, toggleView.$el.closest(".toggle-switch-container"));
      });
      PubSub.trigger("d2:form:interaction:performed", toggleView.$el);
    },
    clearNotificationRibbon: function() {
      $("div.binf-widgets").removeClass("pushBodyDown");
      var elem = document.getElementById("extensionNotification");
      elem && elem.parentNode.removeChild(elem);
    },
    manageElementsBasedOnFlag: function(swichData) {
      var self = this;
      function manageElementsWhenClientIsAvailable() {
        self.ui.locationPathContainer.removeClass("binf-hidden");
        self.ui.currentversionContainer.removeClass("binf-hidden");
        self.ui.addonInstallerContainer.addClass("binf-hidden");
        self.showCurrentVersionDetails();
        self.checkForUpgrade();
        self.createEditablePathViews();
      }
      function manageElementsWhenClientIsNotAvailable() {
        self.ui.locationPathContainer.addClass("binf-hidden");
        self.ui.currentversionContainer.addClass("binf-hidden");
        self.ui.addonInstallerContainer.removeClass("binf-hidden");
        self.ui.addonUpgradeInstallerContainer.addClass("binf-hidden");
        self.ui.addonInstallerButton.attr("tabindex", 0);
      }
      function manageElementsWhenClientIsNotEnabled() {
        self.ui.locationPathContainer.addClass("binf-hidden");
        self.ui.currentversionContainer.addClass("binf-hidden");
        self.ui.addonInstallerContainer.addClass("binf-hidden");
        self.ui.addonUpgradeInstallerContainer.addClass("binf-hidden");
      }
      function manageElementBasedOnStatus(wsctfStatus) {
        if (self.getBrowserPluginMode() !== constants.BrowserPluginMode.WSCTF) {
          manageElementsWhenClientIsNotEnabled();
          return;
        }
        if (wsctfStatus === ctfConstants.Status.NOTATTEMPTED) {
          ctfBridge.init({
            wshandler: wshandler,
            context: self.options.context,
            ignorePreferenceUpdate: ctfUtils.isWsctfAttemptedOnce() === "true"
          });
          if (ctfBridge.getStatus() === ctfConstants.Status.TRYING) {
            performWsctfStatusCheck();
          }
        } else if (wsctfStatus === ctfConstants.Status.SUCCESS) {
          manageElementsWhenClientIsAvailable();
        } else if (wsctfStatus === ctfConstants.Status.SHOWNOTIFICATION) {
          wshandler.checkForUpgrade().done(function() {
            manageElementsWhenClientIsAvailable();
          }).fail(function() {
            manageElementsWhenClientIsNotAvailable();
          });
        } else {
          manageElementsWhenClientIsNotAvailable();
        }
      }
      function performWsctfStatusCheck() {
        self.checkWsctfStatus().always(function(wsctfStatus) {
          manageElementBasedOnStatus(wsctfStatus);
        });
      }
      if (swichData) {
        performWsctfStatusCheck();
      } else {
        manageElementsWhenClientIsNotEnabled();
        self.clearNotificationRibbon();
      }
    },
    checkForUpgrade: function() {
      var self = this;
      wshandler.checkForUpgrade().done(function() {
        self.ui.addonUpgradeInstallerContainer.removeClass("binf-hidden");
        self.ui.addonUpgradeInstallerButton.attr("tabindex", 0);
      }).fail(function() {
        self.ui.addonUpgradeInstallerContainer.addClass("binf-hidden");
      });
    },
    createEditablePathViews: function() {
      if (this.temporaryPathFieldView && this.checkoutPathFieldView) {
        this.temporaryPathFieldView.revertFieldChanges();
        this.checkoutPathFieldView.revertFieldChanges();
      } else {
        var self = this, temporaryPathKey = "download_location_view", checkoutPathKey = "download_location_checkout", temporaryPathModel = new Backbone.Model({
          data: self.parentView.getPreferenceValue(temporaryPathKey)
        }), checkoutPathModel = new Backbone.Model({
          data: self.parentView.getPreferenceValue(checkoutPathKey)
        });
        this.temporaryPathFieldView = new D2CtfPathFieldView(_.extend({
          mode: "readwrite",
          placeholder: lang.temporaryPathPlaceholder,
          fieldLabel: lang.temporaryPathLabel,
          model: temporaryPathModel,
          onSaveFieldChange: function(value, fieldView) {
            var dfd = $.Deferred();
            self.savePathFieldValue(temporaryPathKey, value, lang.temporaryPathError, fieldView.$el, self.ui.temporaryPathContainer).done(dfd.resolve).fail(dfd.reject);
            return dfd.promise();
          }
        }, this.options));
        this.checkoutPathFieldView = new D2CtfPathFieldView(_.extend({
          mode: "readwrite",
          placeholder: lang.checkoutPathPlaceholder,
          fieldLabel: lang.checkoutPathLabel,
          model: checkoutPathModel,
          onSaveFieldChange: function(value, fieldView) {
            var dfd = $.Deferred();
            self.savePathFieldValue(checkoutPathKey, value, lang.checkoutPathError, fieldView.$el, self.ui.checkoutPathContainer).done(dfd.resolve).fail(dfd.reject);
            return dfd.promise();
          }
        }, this.options));
        this.temporaryPathFieldRegion.show(this.temporaryPathFieldView);
        this.checkoutPathFieldRegion.show(this.checkoutPathFieldView);
        this._addListenerForPathField(this.temporaryPathFieldView, self.ui.temporaryPathContainer);
        this._addListenerForPathField(this.checkoutPathFieldView, self.ui.checkoutPathContainer);
      }
    },
    savePathFieldValue: function(key, value, errorMessage, $element, $parentElement) {
      var self = this, dfd = $.Deferred(), preference = {};
      self.blockActions();
      preference[key] = value;
      self.parentView.hideErrorMessage($parentElement, $element);
      self.parentView.updateUserSettings(preference, self.options).done(function() {
        self.unblockActions();
        dfd.resolve();
      }).fail(function(error) {
        self.unblockActions();
        dfd.reject();
        if (error && error.message) {
          errorMessage = error.message;
        }
        self.parentView.showErrorMessage(errorMessage, $parentElement, $element);
      });
      return dfd.promise();
    },
    showCurrentVersionDetails: function() {
      this.ui.currentversionDetails.html(_.str.sformat(lang.versionDetails, ctfUtils.getVersion()));
    },
    _addListenerForPathField: function(pathFieldView, $parentEl) {
      var self = this;
      this.listenTo(pathFieldView, "field:ctf:path:invalid", function() {
        self.parentView.showErrorMessage(lang.pathFieldInvalidValueError, $parentEl, pathFieldView.$el);
      });
      this.listenTo(pathFieldView, "field:ctf:path:error", function() {
        self.parentView.showErrorMessage(lang.pathFieldCtfError, $parentEl, pathFieldView.$el);
      });
      this.listenTo(pathFieldView, "field:changed", function() {
        self.parentView.hideErrorMessage($parentEl, pathFieldView.$el);
      });
      this.listenTo(pathFieldView, "field:readonly", function() {
        self.parentView.hideErrorMessage($parentEl, pathFieldView.$el);
      });
    },
    _onClickAddonInstallerButton: function() {
      wshandler.downloadCTF();
      PubSub.trigger("d2:form:interaction:performed", this.ui.addonInstallerButton);
    },
    _onKeyDownAddonInstallerButton: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.ui.addonInstallerButton.trigger("click");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    }
  });
});