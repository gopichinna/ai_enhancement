/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/moment", "nuc/utils/types/date", "i18n", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/letter-avatar-random-color/letter-avatar-colors", "csui/controls/form/fields/booleanfield.view", "d2/controls/form/fields/d2selectfield.view", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/widgets.utils", "d2/dialogs/user.settings/impl/user.settings.profile.view", "d2/dialogs/user.settings/impl/user.settings.ctf.view", "d2/utils/date/date.utils", "hbs!d2/dialogs/user.settings/impl/user.settings.dialog", "i18n!d2/dialogs/user.settings/impl/nls/lang", "i18n!d2/dialogs/user.settings/impl/nls/lang.names", "css!d2/dialogs/user.settings/impl/user.settings.dialog", "csui/controls/icons.v2" ], function(_, $, Backbone, Marionette, moment, nucDate, i18n, PubSub, BlockingView, PerfectScrollingBehavior, TabableRegionBehavior, LetterAvatarColor, ToggleSwitchView, D2SelectFieldView, RestResources, utils, widgetUtils, UserSettingsProfileView, UserSettingsCTFView, dateUtils, template, lang, langNames) {
  "use strict";
  return Marionette.LayoutView.extend({
    constructor: function UserSettingsDialogView(options) {
      _.defaults(options, {});
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.context = this.options.context;
      this.connector = this.options.connector;
      this.initialUserPreference = _.clone(RestResources.getCurrentUser().get("preferences"));
      this.preferenceUpdatedMap = {};
      this.localStorageKeys = [ "last_navigated_path" ];
      this.options.parentView = this;
      if (this.options.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    className: "d2-user-settings-dialog",
    template: template,
    ui: {
      defaultImage: ".d2-profile-default-image",
      personalizedImage: ".d2-profile-image",
      userSettingsBody: ".d2-user-settings-body",
      refreshContainer: ".refresh-container",
      refreshButton: ".refresh-button",
      closeButton: ".cs-close"
    },
    events: {
      "click @ui.refreshButton": "_onClickRefreshButton",
      "keydown @ui.refreshButton": "_onKeyDownRefreshButton",
      "keydown @ui.closeButton": "_onKeyDownCloseButton"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-user-settings-body",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    regions: {
      userProfileContainerRegion: ".user-profile-container",
      userSettingsBody: ".d2-user-settings-body",
      ctfContainerRegion: ".ctf-container",
      enableFileGroupingSwitchRegion: ".enable-file-grouping-switch",
      lastNavigationPathSwitchRegion: ".last-navigation-path-switch",
      accessibleCompliantModeSwitchRegion: ".accessible-compliant-mode-switch",
      defaultLanguageFieldRegion: ".default-language-field",
      dateTimeFormatFieldRegion: ".datetimeformat-field"
    },
    templateHelpers: function() {
      return {
        lang: lang,
        sortOptionsHeader: lang.sortOptionsHeader,
        enableFileGroupingLabel: lang.enableFileGroupingLabel,
        lastNavigatedPathHeader: lang.lastNavigatedPathHeader,
        enableLastNavigatedPathHeader: lang.enableLastNavigatedPathHeader,
        accessibilityHeader: lang.accessibilityHeader,
        accessibilityDescription: lang.accessibilityDescription,
        accessibleCompliantModeLabel: lang.accessibleCompliantModeLabel,
        languageHeader: lang.languageHeader,
        languageDescription: lang.languageDescription,
        defaultLanguage: lang.defaultLanguage,
        refreshTitle: lang.refreshTitle,
        refreshAria: lang.refreshAria,
        refreshLabel: lang.refreshLabel,
        iconName: "d2_action_refresh",
        dateFormatHeader: lang.dateFormatHeader,
        dateFormatDescription: lang.dateFormatDescription,
        dateTimeFormat: lang.dateTimeFormat
      };
    },
    onRender: function() {
      this.createUserProfile();
      this.createCtfFields();
      this.createEnableFileGroupingSwitch("order_folder_before");
      this.createLastNavigationPathSwitch("last_navigated_path");
      this.createAccessibleCompliantModeSwitch("sv_accessible_compliant");
      this.createDefaultLanguageField();
      this.createDateFormatSelectionForm();
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$el.find("[tabindex]:visible:not([disabled])");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      if (event && event.shiftKey) {
        return tabElements[tabElements.length - 1];
      } else {
        return tabElements[0];
      }
    },
    onLastTabElement: function(shiftTab, event) {
      var visibleElems = this.$el.find("*[tabindex=0]:visible");
      return event.target === (shiftTab ? visibleElems[0] : visibleElems[visibleElems.length - 1]);
    },
    showErrorMessage: function(errorMessage, $parentElement, $element) {
      $parentElement.find(".error-panel").removeClass("binf-hidden");
      $parentElement.find(".error-message").html(errorMessage);
      $element && $element.addClass("binf-has-error");
    },
    hideErrorMessage: function($parentElement, $element) {
      $parentElement.find(".error-panel").addClass("binf-hidden");
      $parentElement.find(".error-message").html("");
      $element && $element.removeClass("binf-has-error");
    },
    getPreferenceValue: function(key) {
      if (this.localStorageKeys.includes(key)) {
        return widgetUtils.getFolderPathInfo()?.lastNavigated;
      } else {
        var value = "";
        if (_.has(RestResources.getCurrentUser().get("preferences"), key)) {
          value = RestResources.getCurrentUser().get("preferences")[key];
        }
        return value;
      }
    },
    updateUserSettings: function(preference) {
      var self = this, dfd = $.Deferred();
      require([ "d2/dialogs/user.settings/user.settings.utils" ], function(UserSettingsUtils) {
        UserSettingsUtils.updateUserSettings(preference, self.options).done(dfd.resolve).fail(dfd.reject);
      });
      return dfd.promise();
    },
    createUserProfile: function() {
      var userSettingsProfileView = new UserSettingsProfileView(this.options);
      this.userProfileContainerRegion.show(userSettingsProfileView);
    },
    createCtfFields: function() {
      var userSettingsCTFView = new UserSettingsCTFView(this.options);
      this.ctfContainerRegion.show(userSettingsCTFView);
    },
    createEnableFileGroupingSwitch: function(key) {
      var switchView = this.createSwitchView(this.getPreferenceValue(key), key, lang.enableFileGroupingError);
      this.enableFileGroupingSwitchRegion.show(switchView);
    },
    createLastNavigationPathSwitch: function(key) {
      var switchView = this.createSwitchView(this.getPreferenceValue(key), key, lang.enableFileGroupingError);
      this.lastNavigationPathSwitchRegion.show(switchView);
    },
    createAccessibleCompliantModeSwitch: function(key) {
      var switchView = this.createSwitchView(this.getPreferenceValue(key), key, lang.accessibleCompliantModeError);
      this.accessibleCompliantModeSwitchRegion.show(switchView);
    },
    createSwitchView: function(switchData, key, errorMessage) {
      var self = this, switchModel = new Backbone.Model({
        data: switchData
      }), switchView = new ToggleSwitchView({
        id: _.uniqueId(key),
        model: switchModel
      });
      this.listenTo(switchModel, "change:data", function(model, value) {
        self.onSwitchChange(model, value, key, errorMessage, switchView);
      });
      return switchView;
    },
    onSwitchChange: function(model, value, key, errorMessage, toggleView) {
      var self = this;
      var preference = {};
      preference[key] = value;
      var $checkbox = toggleView.$el.find(".binf-switch-container input[type=checkbox]");
      $checkbox.prop("disabled", true);
      self.hideErrorMessage(toggleView.$el.closest(".toggle-switch-container"));
      if (this.localStorageKeys.includes(key)) {
        widgetUtils.setFolderPathInfo(value);
        self._checkUserDataForRefresh(key);
      } else {
        self.blockActions();
        self.updateUserSettings(preference, this.options).done(function() {
          self.unblockActions();
          $checkbox.prop("disabled", false);
          $checkbox[0] && $checkbox[0].focus();
          self._checkUserDataForRefresh(key);
        }).fail(function(error) {
          self.unblockActions();
          $checkbox.prop("disabled", false);
          $checkbox[0] && $checkbox[0].focus();
          if (error && error.message) {
            errorMessage = error.message;
          }
          self.showErrorMessage(errorMessage, toggleView.$el.closest(".toggle-switch-container"));
        });
      }
      PubSub.trigger("d2:form:interaction:performed", toggleView.$el);
    },
    createDefaultLanguageField: function() {
      if (this.languageSelectFieldView) {
        this.languageSelectFieldView.revertFieldChanges();
      } else {
        var self = this, preferenceKey = "default_language", languageCollection = this.getLanguagesCollection(), defaultLanguageData = self.getPreferenceValue(preferenceKey), $parentEl = self.$el.find(".language-container .default-language-container");
        var locale = defaultLanguageData.split("_")[0];
        if (locale !== "pt") {
          locale = defaultLanguageData;
        }
        var selectedLanguage = languageCollection.findWhere({
          id: locale
        });
        if (!selectedLanguage) {
          selectedLanguage = languageCollection.findWhere({
            id: ""
          });
        }
        var fieldOptions = {
          selected: selectedLanguage,
          collection: languageCollection,
          mode: "readwrite",
          onSaveFieldChange: function(model, fieldView) {
            var dfd = $.Deferred(), preference = {};
            self.blockActions();
            var locale = model.get("id");
            if (locale === "pt") {
              locale = "pt_BR";
            }
            preference["default_language"] = locale;
            self.hideErrorMessage($parentEl, fieldView.$el);
            self.updateUserSettings(preference, self.options).done(function() {
              self.unblockActions();
              self._checkUserDataForRefresh("default_language");
              dfd.resolve();
            }).fail(function(error) {
              self.unblockActions();
              dfd.reject();
              var errorMessage = lang.defaultLanguageError;
              if (error && error.message) {
                errorMessage = error.message;
              }
              self.showErrorMessage(errorMessage, $parentEl, fieldView.$el);
            });
            return dfd.promise();
          }
        };
        this.languageSelectFieldView = new D2SelectFieldView(fieldOptions);
        this.defaultLanguageFieldRegion.show(this.languageSelectFieldView);
        this.listenTo(this.languageSelectFieldView, "field:changed", function() {
          self.hideErrorMessage($parentEl, this.languageSelectFieldView.$el);
        });
        this.listenTo(this.languageSelectFieldView, "field:readonly", function() {
          self.hideErrorMessage($parentEl, this.languageSelectFieldView.$el);
        });
      }
    },
    getLanguagesCollection: function() {
      var loadableLocales = i18n.settings.loadableLocales, localeObjects = [ {
        id: "",
        name: lang.browserDefault
      } ], loadableLocalesCollection, localeList;
      if (loadableLocales && loadableLocales.length > 0) {
        localeList = _.map(loadableLocales, function(item) {
          if (item === "root") {
            item = "en";
          }
          return {
            id: item,
            name: langNames[item]
          };
        });
        localeList = _.sortBy(localeList, "name");
        localeObjects = localeObjects.concat(localeList);
        loadableLocalesCollection = new Backbone.Collection(localeObjects);
      }
      return loadableLocalesCollection;
    },
    _checkUserDataForRefresh: function(key) {
      var oldValue = this.initialUserPreference[key];
      var value = this.getPreferenceValue(key);
      if (value !== oldValue) {
        this.preferenceUpdatedMap[key] = true;
      } else {
        this.preferenceUpdatedMap[key] = false;
      }
      if (_.contains(_.values(this.preferenceUpdatedMap), true)) {
        this._showRefreshButton();
      } else {
        this._hideRefreshButton();
      }
    },
    _showRefreshButton: function() {
      this.ui.refreshContainer.removeClass("binf-hidden");
      this.ui.refreshButton.attr("tabindex", 0);
      this.ui.userSettingsBody.addClass("refresh-visible");
      if (this.options && this.options.userSettingsData) {
        this.options.userSettingsData["forceRefresh"] = true;
      }
    },
    _hideRefreshButton: function() {
      this.ui.refreshContainer.addClass("binf-hidden");
      this.ui.userSettingsBody.removeClass("refresh-visible");
      if (this.options && this.options.userSettingsData) {
        delete this.options.userSettingsData["forceRefresh"];
      }
    },
    _onClickRefreshButton: function() {
      window.location.reload();
    },
    _onKeyDownRefreshButton: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.ui.refreshButton.trigger("click");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    _onKeyDownCloseButton: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        $(event.target).click();
        break;

       case 9:
        if (!event.shiftKey) {
          return;
        }
        var visibleElems = this.$el.find("*[tabindex=0]:visible");
        visibleElems && visibleElems[visibleElems.length - 1].focus();
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    createDateFormatSelectionForm: function() {
      var date = new Date();
      this.createDateTimeFormatSelectionField(date);
    },
    createDateTimeFormatSelectionField: function(date) {
      var self = this, preferenceKey = "date_time_format", dateTimeFormatsCollection = self.getDateTimeFormatsCollections(date), selectedDateTimeFormat = dateTimeFormatsCollection.findWhere({
        id: self.getPreferenceValue(preferenceKey)
      }), errorMessage = lang.dateTimeFormatError, $parentEl = self.$el.find(".dateformat-settings-container .dateformat-container .datetimeformat-field-container");
      if (!selectedDateTimeFormat) {
        var localeDateTimeFormat = nucDate.getExactFormat("L LT");
        dateTimeFormatsCollection.push({
          id: localeDateTimeFormat,
          name: moment(date).format(localeDateTimeFormat)
        });
        selectedDateTimeFormat = dateTimeFormatsCollection.findWhere({
          id: localeDateTimeFormat
        });
      }
      var fieldOptions = {
        selected: selectedDateTimeFormat,
        collection: dateTimeFormatsCollection,
        mode: "readwrite",
        onSaveFieldChange: function(model, fieldView) {
          return self.onUserPreferenceFieldChange(model, preferenceKey, errorMessage, fieldView, $parentEl);
        }
      };
      self.dateTimeFormatFieldView = new D2SelectFieldView(fieldOptions);
      self.dateTimeFormatFieldRegion.show(self.dateTimeFormatFieldView);
      self.listenTo(self.dateTimeFormatFieldView, "field:changed", function() {
        self.hideErrorMessage($parentEl, self.dateTimeFormatFieldView.$el);
      });
      self.listenTo(self.dateTimeFormatFieldView, "field:readonly", function() {
        self.hideErrorMessage($parentEl, this.dateTimeFormatFieldView.$el);
      });
    },
    getDateTimeFormatsCollections: function(date) {
      var dateTimeFormats = [];
      _.each(dateUtils.dateTimeFormatsMap, function(svFormat, preferenceFormat) {
        dateTimeFormats.push({
          id: preferenceFormat,
          name: moment(date).format(svFormat)
        });
      });
      return new Backbone.Collection(dateTimeFormats);
    },
    onUserPreferenceFieldChange: function(model, preferenceKey, errorMessage, fieldView, parentEl) {
      var self = this, dfd = $.Deferred(), preference = {};
      self.blockActions();
      var value = model.get("id");
      preference[preferenceKey] = value;
      self.hideErrorMessage(parentEl, fieldView.$el);
      self.updateUserSettings(preference, self.options).done(function() {
        self.unblockActions();
        self._checkUserDataForRefresh(preferenceKey);
        dfd.resolve();
      }).fail(function(error) {
        self.unblockActions();
        dfd.reject();
        var errorMessage = errorMessage;
        if (error && error.message) {
          errorMessage = error.message;
        }
        self.showErrorMessage(errorMessage, parentEl, fieldView.$el);
      });
      return dfd.promise();
    }
  });
});