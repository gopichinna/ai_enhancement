/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/lib/underscore", "csui/utils/base", "smart/themes/theming", "csui/pages/start/start.page.view", "csui/perspective.manage/pman.view.branding", "hbs!csui/perspective.manage/impl/jato/branding", "csui/perspective.manage/jato/settings.panel/settings.panel.view", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/next.node", "smart/controls/app.header/app.header.view", "i18n", "i18n!csui/perspective.manage/impl/nls/lang" ], function(Marionette, _, base, theming, StartPageView, PmanBrandingView, template, SettingsPanelView, ApplicationScopeModelFactory, NextNodeModelFactory, SmartNavigationHeaderView, i18n, lang) {
  let JATO_THEMES_INVERSION = {
    light: "dark",
    dark: "light"
  };
  let BrandingView = PmanBrandingView.extend({
    template: template,
    className: function() {
      return PmanBrandingView.prototype.className.call(this) + " csui-jato-manage-branding";
    },
    templateHelpers: function() {
      const {
        lightModeBranding,
        darkModeBranding,
        headerSettings
      } = lang;
      return _.extend(PmanBrandingView.prototype.templateHelpers.call(this), {
        lightModeBranding: lightModeBranding,
        darkModeBranding: darkModeBranding,
        headerSettings: headerSettings
      });
    },
    constructor: function BrandingView(options) {
      PmanBrandingView.prototype.constructor.apply(this, arguments);
    },
    onClickSave: function() {
      this.applyHeaderChanges().done(() => {
        this.removePreviewBrandingStyleSheet();
        this._showMessage("success", lang.LblBrandingChanges);
        this._doCleanup();
      }).fail(error => {
        const err = new base.Error(error);
        this._showMessage("error", err.message);
        this.el.querySelector(".pman-icon-save").setAttribute("disabled", true);
        this.unblockActions();
      });
    },
    onClickClose: function() {
      this.options?.container[0]?.querySelector(".cs-perspective-panel").removeAttribute("style");
      this.removePreviewBrandingStyleSheet();
      this._doCleanup();
    },
    ui: function() {
      return _.extend({}, PmanBrandingView.prototype.ui, {
        lightHeaderContainer: ".pman-light-header-container",
        darkHeaderContainer: ".pman-dark-header-container",
        settingsContainer: ".pman-header-jato-settings-container"
      });
    },
    _triggerEditMode: function() {
      this.context.triggerMethod("enter:edit:perspective");
    },
    _initHeaderPreview: function() {
      this._initExtendedHeaderPreview("light");
      this._initExtendedHeaderPreview("dark");
    },
    _getPreviewHeader: function(panel) {
      return panel === "dark" ? this.darkPreviewHeader : this.lightPreviewHeader;
    },
    _initExtendedHeaderPreview: function(panel) {
      var nextNode = this.context.getModel(NextNodeModelFactory, {
        unique: true
      });
      var applicationScope = this.context.getModel(ApplicationScopeModelFactory, {
        unique: true
      });
      this.useV2AppHeader = StartPageView.useV2AppHeader;
      applicationScope.set("id", "");
      let header = this._getPreviewHeader(panel);
      header = new SmartNavigationHeaderView({
        context: this.context,
        previewBranding: this.context.previewBranding,
        nextNode: nextNode,
        applicationScope: applicationScope,
        isPerspectiveEdit: true,
        transparent: true,
        rtl: i18n.settings.rtl,
        brandingConfig: this.context.previewBranding,
        enableHamburger: StartPageView.enableHamburger
      });
      this.containerHeaderRegion = new Marionette.Region({
        el: panel === "dark" ? this.ui.darkHeaderContainer : this.ui.lightHeaderContainer
      });
      if (panel == "dark") {
        this.darkPreviewHeader = header;
      } else {
        this.lightPreviewHeader = header;
      }
      this.containerHeaderRegion.show(header);
      header?.trigger("render:header");
      header.on("render", this._preventDefaultFocusables, header);
      if (this.context.previewBranding.get("brandingSettingCodes")?.themes[panel].isInvertIconColor) {
        this.$el.find(`.pman-${panel}-header-container.pman-jato-header-container`).addClass("csui-app-header-invert");
      }
    },
    onRender: function() {
      const self = this;
      this.options.mode = "editNavigationHeader";
      document.body.classList.add("csui-pman-header-config", "perspective-editing");
      this._showHeader();
      this.listenTo(this.settingsRegion?.currentView, "change:jato:settings", function() {
        self.el.querySelector(".pman-icon-save").removeAttribute("disabled");
      });
    },
    onShow: function() {
      this._setFocusOnFirstWidgetHeader();
    },
    onKeyDown: function(event) {
      let resetButton = event.target.classList?.contains("csui-header-config-reset-btn");
      if (!event.shiftKey && event.keyCode === 9 && resetButton) {
        this._setFocusOnFirstElementHeader(event);
      }
      if (!event.shiftKey && event.target.classList.contains("pman-cancel-edit") && event.keyCode === 9) {
        this._setFocusOnFirstWidgetHeader();
        return false;
      }
    },
    _initSettingsPanel: function() {
      var settingsPanel = new SettingsPanelView({
        context: this.context,
        previewBranding: this.context.previewBranding,
        pmanBrandingView: this
      });
      this.settingsRegion = new Marionette.Region({
        el: this.ui.settingsContainer
      });
      this.settingsRegion.show(settingsPanel);
      this.listenTo(settingsPanel, "change:jato:settings", function(updatedConfig) {
        if (updatedConfig === "resetBranding") {
          this.darkPreviewHeader?.options?.brandingConfig.trigger("change:branding");
          this.lightPreviewHeader?.options?.brandingConfig.trigger("change:branding");
          let bgColor = "var(--jato-background-elevation-level-1, transparent)";
          this.darkPreviewHeader.$el.find("otc-header-bar").css("background", bgColor);
          this.lightPreviewHeader.$el.find("otc-header-bar").css("background", bgColor);
          this.$el.find(".pman-jato-header-container").removeClass("csui-app-header-invert");
          this.removePreviewBrandingStyleSheet();
          return;
        }
        if (!updatedConfig || Object.keys(updatedConfig).length === 0) return;
        let updatedValue = {
          brandingSettingCodes: {}
        };
        const currentTheme = theming.getTheme();
        let brandingSettingCodes = this.context.previewBranding.get("brandingSettingCodes");
        let currentBrandingSettingCodes = brandingSettingCodes?.themes[currentTheme];
        let tempBrandingSettingCodes = updatedConfig.brandingSettingCodes || {};
        const darkHeaderBarEle = this._getPreviewHeader("dark")?.el?.querySelector("otc-header-bar");
        const lightHeaderBarEle = this._getPreviewHeader("light")?.el?.querySelector("otc-header-bar");
        const darkThemeBgColorUnConverted = getComputedStyle(darkHeaderBarEle)?.backgroundColor;
        const lightThemeBgColorUnConverted = getComputedStyle(lightHeaderBarEle)?.backgroundColor;
        const darkThemeBgColor = darkHeaderBarEle ? this.rgbStringToHex(darkThemeBgColorUnConverted) || darkThemeBgColorUnConverted : "#FFFFFF";
        const lightThemeBgColor = lightHeaderBarEle ? this.rgbStringToHex(lightThemeBgColorUnConverted) || lightThemeBgColorUnConverted : "#FFFFFF";
        const isInvertIconColorCurrentTheme = currentBrandingSettingCodes?.isInvertIconColor;
        let themeUpdated;
        const isThemesUpdated = updatedConfig?.brandingSettingCodes?.themes;
        if (isThemesUpdated) {
          themeUpdated = Object.keys(updatedConfig.brandingSettingCodes?.themes)[0];
          let updatedBrandingSettingCodes = updatedConfig.brandingSettingCodes?.themes[currentTheme];
          if (themeUpdated !== currentTheme) {
            updatedBrandingSettingCodes = updatedConfig.brandingSettingCodes?.themes[themeUpdated];
          }
          tempBrandingSettingCodes = structuredClone(brandingSettingCodes);
          if (updatedBrandingSettingCodes?.customBrandingBgColor && (themeUpdated == "dark" && updatedBrandingSettingCodes?.customBrandingBgColor?.toLowerCase() !== darkThemeBgColor || themeUpdated == "light" && updatedBrandingSettingCodes?.customBrandingBgColor?.toLowerCase() !== lightThemeBgColor)) {
            tempBrandingSettingCodes.themes[themeUpdated].customBgColor = updatedBrandingSettingCodes?.customBrandingBgColor;
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
          }
          if (updatedBrandingSettingCodes.brandLogoUri) {
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
            updatedValue.brandingSettingCodes.themes[themeUpdated].brandLogoUri = updatedBrandingSettingCodes.brandLogoUri;
            updatedValue.brandingSettingCodes.themes[themeUpdated].fileDetails = updatedBrandingSettingCodes.fileDetails;
          }
          if (updatedBrandingSettingCodes?.isInvertIconColor !== undefined && (themeUpdated == currentTheme && updatedBrandingSettingCodes?.isInvertIconColor !== isInvertIconColorCurrentTheme || themeUpdated !== currentTheme)) {
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
            updatedValue.brandingSettingCodes.themes[themeUpdated].isInvertIconColor = updatedBrandingSettingCodes.isInvertIconColor;
          }
        }
        const updateTextValue = textKey => {
          if (updatedConfig.brandingSettingCodes[textKey]) {
            tempBrandingSettingCodes = {
              ...brandingSettingCodes,
              ...tempBrandingSettingCodes,
              [textKey]: updatedConfig.brandingSettingCodes[textKey]
            };
            updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
          } else if (updatedConfig.brandingSettingCodes[textKey] === "") {
            updatedValue.brandingSettingCodes[textKey] = "";
          }
        };
        updateTextValue("primaryText");
        updateTextValue("secondaryText");
        updateTextValue("versionText");
        updatedValue.brandingSettingCodes = {
          ...this.context.previewBranding?.attributes.brandingSettingCodes || {},
          ...updatedValue.brandingSettingCodes
        };
        updatedValue = {
          ...this.context.previewBranding?.attributes || {},
          ...updatedValue
        };
        this.context.previewBranding.set(updatedValue);
        if (themeUpdated == "dark") {
          this.darkPreviewHeader?.options?.brandingConfig.trigger("change:branding");
        } else if (themeUpdated == "light") {
          this.lightPreviewHeader?.options?.brandingConfig.trigger("change:branding");
        } else {
          this.darkPreviewHeader?.options?.brandingConfig.trigger("change:branding");
          this.lightPreviewHeader?.options?.brandingConfig.trigger("change:branding");
        }
        this.context.previewBranding.set("isBrandingChangeTriggered", true);
        this.options.context.trigger("change");
        this.applyJatoPreviewBrandingStyleSheet(updatedValue);
        this.applyInvertColor(updatedValue);
      });
    },
    applyInvertColor: function(brandConfig) {
      let themes = brandConfig.brandingSettingCodes.themes;
      for (theme in themes) {
        let themeObj = themes[theme];
        if (themeObj.isInvertIconColor !== undefined) {
          let themeHeader = this.$el.find(`.pman-${theme}-header-container.pman-jato-header-container`), invertClass = "csui-app-header-invert";
          themeObj.isInvertIconColor == true ? themeHeader.addClass(invertClass) : themeHeader.removeClass(invertClass);
        }
      }
    },
    _initBreadcrumb: function() {},
    _prepareForEdit: function() {},
    _registerEventHandler: function() {},
    _onPmanRender: function() {},
    _getExistsWidgetTypes: function() {},
    _initializeWidgets: function() {},
    _savePerspective: function() {}
  });
  return BrandingView;
});