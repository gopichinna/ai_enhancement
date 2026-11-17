/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/perspective.manage/pman.view", "csui/pages/start/start.page.view", "csui/pages/start/impl/navigationheader/navigationheader.view", "smart/controls/app.header/app.header.view", "i18n", "csui/perspective.manage/settings.panel/settings.panel.view", "csui/controls/breadcrumbs/breadcrumbs.view", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/factories/next.node", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/utils/commonconfig.util", "i18n!csui/perspective.manage/impl/nls/lang", "hbs!csui/perspective.manage/impl/pman.branding", "csui/utils/contexts/factories/branding.config.factory", "csui/utils/namedsessionstorage", "css!csui/perspective.manage/impl/pman.branding", "css!csui/perspective.manage/settings.panel/impl/settings.panel" ], function(module, _, $, Backbone, Marionette, CSUIPManView, StartPageView, CSUINavigationHeaderView, SmartNavigationHeaderView, i18n, SettingsPanelView, BreadcrumbsView, ApplicationScopeModelFactory, NextNodeModelFactory, TabablesBehavior, CommonConfig, lang, template, BrandingConfigFactory, NamedSessionStorage) {
  var pmanContainer;
  let config = module.config();
  _.defaults(config, {
    enableHome: CommonConfig.enableFeatureInSmartView() || false
  });
  var BrandingPManView = CSUIPManView.extend({
    className: function() {
      return CSUIPManView.prototype.className.call(this) + " branding-pman";
    },
    ui: _.extend({
      centerTools: ".pman-header .pman-center-tools",
      brandingHeaderOptions: ".pman-header .pman-tools-container",
      centerToolsTab: ".pman-header .pman-center-tools .pman-tab",
      headerContainer: ".pman-container-header-container .pman-container-header",
      breadcrumbContainer: ".pman-container-header-container .pman-container-breadcrumb",
      settingsContainer: ".pman-header-settings-container"
    }, CSUIPManView.prototype.ui),
    events: _.extend({
      "click @ui.centerToolsTab": "onTabClick"
    }, CSUIPManView.prototype.events),
    template: template,
    templateHelpers: function() {
      var csuiHelpers = CSUIPManView.prototype.templateHelpers.call(this);
      return _.extend(csuiHelpers, {
        pageContent: lang.pageContent,
        pageContentAriaLabel: lang.pageContentAriaLabel,
        header: lang.header,
        headerAriaLabel: lang.headerAriaLabel,
        labelHomepageHeader: lang.homePageHeader,
        labelPageHeader: lang.pageHeader,
        isHomePage: this.isHomePage
      });
    },
    constructor: function BrandingPManView(options) {
      CSUIPManView.prototype.constructor.apply(this, arguments);
      this.on("render", this._onPmanRender);
      this.brandingSettingsModel = new Backbone.Model();
      this.context.previewBranding = this.context.getModel(BrandingConfigFactory);
      this.isHomePage = !this.context.getModel(ApplicationScopeModelFactory).get("id");
      let brandingConfig = this.context.navigationHeaderView?.brandingConfigData ?? this.context.navigationHeaderView?.options?.brandingConfig ?? {};
      const brandLogoUri = brandingConfig?.get("brandLogoUri");
      const brandLogoUri_id = brandingConfig?.get("brandLogoUri_id");
      const brandingSettingCodes = brandingConfig?.get("brandingSettingCodes");
      brandLogoUri && this.context.previewBranding.set({
        brandLogoUri: brandLogoUri
      });
      brandLogoUri_id && this.context.previewBranding.set({
        brandLogoUri_id: brandLogoUri_id
      });
      brandingSettingCodes && this.context.previewBranding.set({
        brandingSettingCodes: brandingSettingCodes
      });
    },
    _doCleanup: function() {
      BrandingPManView.__super__._doCleanup.apply(this, arguments);
      $(document.body).removeClass("csui-pman-header-config");
      this.originalLogoUrl && URL.revokeObjectURL(this.originalLogoUrl);
      this.context.previewBranding?.set({
        brandingSettingCodes: undefined,
        brandLogoUri: undefined
      });
      const tempBrandingCSS = this.context.navigationHeaderView?.brandingConfigData?.get("tempBrandingCSS");
      tempBrandingCSS && this.context.navigationHeaderView?.brandingConfigData?.set({
        brandingCSS: tempBrandingCSS
      });
      this.context?.navigationHeaderView?.brandingConfigData?.trigger("change:branding");
      this.landingHeader?.destroy();
      this.containerHeader?.destroy();
      this.previewHeader?.render();
    },
    getContainer: function() {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $("<div>").appendTo(this.options.container)[0];
      }
      return pmanContainer;
    },
    _onPmanRender: function() {
      this.ui.centerTools.find(".pman-tab").first().addClass("binf-active");
    },
    onTabClick: function(event) {
      this.ui.centerTools.find(".pman-tab").removeClass("binf-active");
      $(event.target).addClass("binf-active");
      if ($(event.target).hasClass("pman-header-tab")) {
        this.options.mode = "editNavigationHeader";
        $(document.body).addClass("csui-pman-header-config");
        if (!this.$el.find(".csui-header-settings-list").length) {
          this._showHeader();
        }
      } else {
        this.options.mode = "edit";
        $(document.body).removeClass("csui-pman-header-config");
      }
    },
    _showHeader: function() {
      this._initHeaderPreview();
      this._initSettingsPanel();
    },
    _initHeaderPreview: function() {
      this._initExtendedHeaderPreview();
      this._initBreadcrumb();
    },
    _initExtendedHeaderPreview: function() {
      var nextNode = this.context.getModel(NextNodeModelFactory, {
        unique: true
      });
      var applicationScope = this.context.getModel(ApplicationScopeModelFactory, {
        unique: true
      });
      applicationScope.set("id", "");
      this.useV2AppHeader = StartPageView.useV2AppHeader;
      let NavigationHeaderView = this.useV2AppHeader ? SmartNavigationHeaderView : CSUINavigationHeaderView;
      this.previewHeader = new NavigationHeaderView({
        context: this.context,
        previewBranding: this.context.previewBranding,
        nextNode: nextNode,
        applicationScope: applicationScope,
        isPerspectiveEdit: true,
        transparent: true,
        enableHamburger: StartPageView.enableHamburger,
        rtl: i18n.settings.rtl,
        brandingConfig: this.context.previewBranding
      });
      this.containerHeaderRegion = new Marionette.Region({
        el: this.ui.headerContainer
      });
      this.containerHeaderRegion.show(this.previewHeader);
      this.previewHeader?.trigger("render:header");
      this.previewHeader.on("render", this._preventDefaultFocusables, this.previewHeader);
    },
    _initBreadcrumb: function() {
      var breadcrumbCollection = new Backbone.Collection([ {
        container: true,
        name: lang.enterprise
      }, {
        container: true,
        name: lang.productManagement
      }, {
        container: true,
        name: lang.images
      } ]);
      this.breadcrumbs = new BreadcrumbsView({
        context: this.context,
        collection: breadcrumbCollection,
        fetchOnCollectionUpdate: false,
        enableHome: config.enableHome,
        theme: "dark",
        honorCustomizations: true,
        textColor: this.context?.previewBranding?.get("brandingSettingCodes")?.breadcrumbColor
      });
      this.breadcrumbRegion = new Marionette.Region({
        el: this.ui.breadcrumbContainer
      });
      this.breadcrumbRegion.show(this.breadcrumbs);
      this.breadcrumbs.listenTo(this.breadcrumbs, "render", this._preventDefaultFocusables, this.breadcrumbs);
      this.breadcrumbs.synchronizeCollections();
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
      this.listenTo(settingsPanel, "change:settings", function(updatedConfig) {
        if (!updatedConfig || Object.keys(updatedConfig).length === 0) return;
        let updatedValue = {
          brandingSettingCodes: {}
        };
        let brandingSettingCodes = this.context.previewBranding.get("brandingSettingCodes");
        let tempBrandingSettingCodes = updatedConfig.brandingSettingCodes || {};
        const headerBarEle = this.useV2AppHeader ? this.previewHeader?.el?.querySelector("otc-header-bar") : this.previewHeader?.el?.querySelector(".binf-widgets .csui-navbar.binf-navbar");
        const color = headerBarEle ? getComputedStyle(headerBarEle)?.backgroundColor : "#FFFFFF";
        if (updatedConfig.brandingSettingCodes?.customBrandingBgColor && updatedConfig.brandingSettingCodes?.customBrandingBgColor !== color) {
          tempBrandingSettingCodes = {
            ...brandingSettingCodes,
            customBrandingBgColor: updatedConfig.brandingSettingCodes.customBrandingBgColor
          };
          updatedValue.brandingSettingCodes = tempBrandingSettingCodes;
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
        updateTextValue("breadcrumbColor");
        updateTextValue("iconThemes");
        updateTextValue("primaryText");
        updateTextValue("secondaryText");
        updateTextValue("versionText");
        if (updatedConfig.brandLogoUri) {
          updatedValue.brandLogoUri = updatedConfig.brandLogoUri;
          updatedValue.fileDetails = updatedConfig.fileDetails;
        }
        updatedValue.brandingSettingCodes = {
          ...this.context.previewBranding?.attributes.brandingSettingCodes || {},
          ...updatedValue.brandingSettingCodes
        };
        updatedValue = {
          ...this.context.previewBranding?.attributes || {},
          ...updatedValue
        };
        this.context.previewBranding.set(updatedValue);
        this.previewHeader?.options?.brandingConfig.trigger("change:branding");
        this.context.previewBranding.set("isBrandingChangeTriggered", true);
        this.options.context.trigger("change");
        this.applyCFPreviewBrandingStyleSheet(updatedValue);
        this.breadcrumbs.options.textColor = updatedValue?.brandingSettingCodes?.breadcrumbColor;
        this.breadcrumbs.render();
      });
    },
    _preventDefaultFocusables: function() {
      this.$el.find(TabablesBehavior.focusablesSelector).attr("tabindex", "-1");
    },
    onKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
        if (event.target.className.includes("pman-tab")) {
          this.onTabClick(event);
        }
        event.stopPropagation();
        break;

       case 9:
        if (!event.shiftKey && $(event.target).is(this.ui.cancelEdit)) {
          const isHeaderConfigActive = this.$el.find(".pman-header-tab").hasClass("binf-active");
          if (isHeaderConfigActive) {
            this._setFocusOnFirstWidgetHeader();
          } else {
            this._setFocusOnFirstWidgetPageContent();
          }
          return false;
        }
      }
    },
    _setFocusOnFirstWidgetHeader: function() {
      let focusableEle = this.options.container.find(".csui-header-settings-list [tabindex=0]")?.first();
      focusableEle?.focus();
    },
    _setFocusOnFirstWidgetPageContent: function() {
      var focusableEle = this.options.container.find(".cs-perspective-panel .cs-perspective .csui-pman-editable-widget")?.first(), shortcutButton = focusableEle.find(".shortcut-group-wrapper");
      if (shortcutButton.attr("tabindex") === "0") {
        shortcutButton[0].focus();
      } else {
        focusableEle.find(".wrapper-button")?.[0]?.focus();
      }
    },
    _setFocusOnFirstElementHeader: function(event) {
      let focusableEles = this.ui.brandingHeaderOptions[0].querySelectorAll("button:not([disabled]), *[tabindex]");
      focusableEles[0]?.focus();
      event.preventDefault();
    }
  });
  return BrandingPManView;
});