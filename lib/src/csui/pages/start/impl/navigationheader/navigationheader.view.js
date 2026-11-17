/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/user", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/contexts/factories/application.scope.factory", "csui/widgets/navigation.header/navigation.header.controls", "hbs!csui/pages/start/impl/navigationheader/impl/navigationheader", "i18n!csui/pages/start/impl/nls/lang", "i18n!csui/pages/start/nls/lang", "csui/utils/high.contrast/detector!", "csui/lib/radio", "csui/utils/url", "csui/utils/node.links/node.links", "csui/utils/base", "csui/utils/contexts/factories/branding.config.factory", "csui/perspective.manage/mixins/update.supportasset.branding.config.mixin", "csui/utils/commonconfig.util", "csui/utils/cache.assets/cache.assets", "smart/themes/theming", "css!csui/pages/start/impl/navigationheader/impl/navigationheader", "csui/lib/jquery.when.all" ], function(require, module, _, $, Backbone, Marionette, GlobalMessage, UserModelFactory, LayoutViewEventsPropagationMixin, ApplicationScopeModelFactory, controls, template, lang, titleLang, highContrast, Radio, Url, NodeLinks, base, BrandingConfigFactory, UpdateSupportAssetBrandingConfigMixin, CommonConfigUtil, CacheAssets, theming) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    enableMinimiseButtonOnProgressPanel: true
  });
  var NavigationHeaderView = Marionette.LayoutView.extend({
    template: template,
    regions: {
      messageRegion: ".csui-navbar-message"
    },
    ui: {
      navbar: ".csui-navbar",
      branding: ".binf-navbar-brand",
      logo: ".csui-logo-image",
      left: ".binf-navbar-left",
      right: ".binf-navbar-right",
      csuiLogo: ".csui-logo"
    },
    events: {
      "click @ui.csuiLogo": "onClickHomeIcon",
      "keydown @ui.csuiLogo": "onKeydownHomeIcon"
    },
    templateHelpers: function() {
      return {
        mainNavigationAria: lang.mainNavigationAria,
        productLogoAria: _.str.sformat(lang.productLogoAria, titleLang.ProductName)
      };
    },
    constructor: function NavigationHeaderView(options) {
      console.warn('DEPRECATED: Instead use "smart/controls/app.header/app.header.view".');
      Marionette.LayoutView.call(this, options);
      this.propagateEventsToRegions();
      this.headerConfig = null;
      this.user = options.user || this.options.context.getModel(UserModelFactory);
      this.applicationScope = options.applicationScope || this.options.context.getModel(ApplicationScopeModelFactory);
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.listenTo(this.brandingConfigData, "change:branding", this._applyBrandingStyles);
      this.listenTo(this, "render:controls", this._adjustControls.bind(this));
      this.listenTo(this, "processbar:minimize processbar:maximize", this._adjustControlsWithAnimation.bind(this));
      this.listenTo(this, "before:destroy", _.bind(function() {
        $(window).off("resize." + this.cid, this._adjustControls.bind(this));
      }, this));
      $(window).on("resize." + this.cid, this._adjustControls.bind(this));
      this.listenTo(this.options.context?.previewBranding, "change", this._onRenderPage);
      this.listenTo(this.options.context?.previewBranding, "exit:edit:perspective", this._applyBrandingStyles);
      this.listenTo(this.options.context, "sync error", this._toggleVisibility);
      this.listenTo(this, "before:destroy", _.bind(function() {}, this));
      Array.isArray(CacheAssets) && CacheAssets.length > 0 && this._cacheAssets();
    },
    _onRenderPage: function() {
      if (this.options.isPerspectiveEdit) {
        const newConfig = this.user?.get("headerconfig");
        if (this.headerConfig?.options?.header?.widgets) {
          var widgetObjs = [];
          _.each(this.headerConfig.options.header.widgets, function(view) {
            var obj = {
              options: view.options,
              view: view.view
            };
            widgetObjs.push(obj);
          });
          this.headerConfig.options.header.widgets = widgetObjs;
        }
        this.headerConfig = _.clone(newConfig);
        this.render();
      }
    },
    _applyBrandingStyles: function() {
      this.applyIconTheme();
      if (this.options.isPerspectiveEdit) {
        const tempBrandingStylesheet = this._addBrandingStyling(this.options.context?.previewBranding, true);
        const logoLink = this.options.context?.previewBranding?.get("brandLogoUri");
        this.loadLogo(logoLink);
        const stylesheetID = "edit-branding-stylesheet";
        document.getElementById(stylesheetID)?.remove();
        const link = document.createElement("link");
        link.id = stylesheetID;
        link.rel = "stylesheet";
        link.href = tempBrandingStylesheet;
        $(".pman-mode-edit").append(link);
      } else {
        const logoLink = this.brandingConfigData?.get("brandLogoUri");
        const cssUri = this.brandingConfigData?.get("brandingCSS");
        this.loadLogo(logoLink);
        this.loadBrandingCSSFile(cssUri);
      }
    },
    _addBrandingStyling: function(config, hardApply) {
      if (!config) return;
      this.createBrandingStyleSheet = theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() ? this.createStyleSheetForJatoTheme : this.createStyleSheet;
      const brandingSettingCodes = config.get("brandingSettingCodes");
      const brandingConfigCSSUri = this.createBrandingStyleSheet(brandingSettingCodes, hardApply);
      return brandingConfigCSSUri;
    },
    applyIconTheme: function() {
      const ct = this.options.context;
      const iconTheme = ct?.previewBranding?.get("brandingSettingCodes")?.iconThemes ?? ct?.navigationHeaderView?.brandingConfigData?.get("brandingSettingCodes")?.iconThemes;
      this.themeCode = iconTheme;
      if (!iconTheme || iconTheme === "default") {
        this.$el.removeClass("icon_theme_dark");
        this.$el.removeClass("icon_theme_light");
      } else if (iconTheme === "dark") {
        this.$el.removeClass("icon_theme_light");
        this.$el.addClass("icon_theme_" + iconTheme);
      } else {
        this.$el.removeClass("icon_theme_dark");
        this.$el.addClass("icon_theme_" + iconTheme);
      }
      let highContrast = matchMedia("(forced-colors: active)");
      if (highContrast.matches) this.$el.removeClass("icon_theme_dark").removeClass("icon_theme_light");
    },
    _adjustControls: function() {
      var totalWidth = this.el.offsetWidth, leftToolbarEle = this.el.getElementsByClassName("binf-navbar-left")[0], leftToolbarWidth = 0, rightToolbarEle = this.el.getElementsByClassName("binf-navbar-right")[0], rightToolbarWidth = 0, logoEle = this.el.getElementsByClassName("csui-logo")[0], logoLocation = controls.logo.get("location"), logoWrapper = this.el.getElementsByClassName("csui-logo-" + logoLocation)[0], isLogoInAbsolutePos = logoWrapper && window.getComputedStyle(logoWrapper).position === "absolute", bufferForLogo = logoLocation === "left" ? 53 : -240, logoEleWidth = logoEle.offsetWidth + bufferForLogo;
      for (var i = 0; i < rightToolbarEle.childElementCount; i++) {
        rightToolbarWidth += rightToolbarEle.children[i].offsetWidth || 0;
      }
      for (i = 0; i < leftToolbarEle.childElementCount; i++) {
        leftToolbarWidth += leftToolbarEle.children[i].offsetWidth || 0;
      }
      var isLogoOverlapped = !(isLogoInAbsolutePos && "left" !== logoLocation ? leftToolbarWidth + logoEleWidth / 2 < totalWidth / 2 && rightToolbarWidth + logoEleWidth / 2 < totalWidth / 2 : totalWidth > leftToolbarWidth + rightToolbarWidth + logoEleWidth);
      if (isLogoOverlapped) {
        logoEle.classList.add("binf-logo-hide");
      } else {
        if (logoEleWidth > 40) {
          logoEle.classList.remove("binf-logo-hide");
        }
      }
      this.listenTo(this, "header:control:clicked", _.bind(function() {
        this.trigger("control:clicked");
      }, this));
      if (this.options.isPerspectiveEdit) {
        let tabindexElements = this.$el[0].querySelectorAll('[tabindex="0"]');
        this.$el.find(tabindexElements).attr("tabindex", "-1");
      }
    },
    _adjustControlsWithAnimation: function() {
      setTimeout(_.bind(function() {
        this._adjustControls();
      }, this), 301);
    },
    onRender: function() {
      var context = this.options.context, self = this;
      GlobalMessage.setProgresspanelMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel
      });
      var logoLocation = controls.logo.get("location");
      if (logoLocation === "none") {
        this.ui.logo.addClass("binf-hidden");
      } else {
        this.ui.branding.addClass("csui-logo-" + logoLocation);
      }
      self.breadCrumbStyles && self.breadCrumbStyles.remove();
      this._applyBrandingStyles();
      this._resolveComponents().done(function() {
        self.trigger("before:render:controls", self);
        controls.leftSide.each(createControls.bind(self, self.ui.left));
        controls.rightSide.each(createControls.bind(self, self.ui.right));
        self.trigger("render:controls", self);
        self._showSystemMessage();
      });
      function createControls(target, control) {
        var View = control.get("view");
        if (View) {
          var el = $("<div>").addClass(control.get("parentClassName")).appendTo(target), region = self.addRegion(_.uniqueId("csui:navigation.header.control"), {
            selector: el
          }), view = new View({
            context: context,
            parentView: self,
            themeCode: self.themeCode,
            highContrast: highContrast
          });
          region.show(view);
        }
      }
      Radio.channel("branding:logo").trigger("update:logo");
    },
    loadBrandingCSSFile: function(brandingCSSURL) {
      const styleID = "csuiBrandingCSSURL";
      document.getElementById(styleID)?.remove();
      if (!brandingCSSURL) return;
      const link = document.createElement("link");
      link.id = styleID;
      link.rel = "stylesheet";
      link.href = brandingCSSURL;
      document.body.appendChild(link);
    },
    loadLogo: function(imgURL) {
      if (!imgURL) {
        this.ui.logo.removeAttr("style");
        return;
      }
      const backgroundImageStyle = `background-image: url(${imgURL}); background-size: contain`;
      this.ui.logo.attr("style", backgroundImageStyle);
    },
    _resolveComponents: function() {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }
      function resolveControl(name) {
        var deferred = $.Deferred();
        require([ name ], deferred.resolve, deferred.reject);
        return deferred.promise();
      }
      var allComponents = controls.leftSide.models.concat(controls.rightSide.models), promises = allComponents.map(function(control) {
        return resolveControl(control.id);
      }), deferred = $.Deferred();
      $.whenAll.apply($, promises).always(function(views) {
        views.forEach(function(view, index) {
          allComponents[index].set("view", view);
        });
        deferred.resolve();
      });
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    },
    _showSystemMessage: function() {
      const shownSystemMsg = localStorage.getItem("shownSystemMsg");
      var self = this;
      if (!shownSystemMsg) {
        localStorage.setItem("shownSystemMsg", true);
        if (CommonConfigUtil.enableFeatureInSmartView()) {
          require([ "csui/models/system.messages/system.message.server.adaptor.mixin" ], function(Mix) {
            Mix.mixin(NavigationHeaderView.prototype);
            const server = self.constructor.prototype.makeServerAdaptor(self.options.context?._factories?.connector?.property);
            server.parseResponse(lang);
          });
        }
      }
    },
    addLinkToIcon: function() {
      var connector = this.options && this.options.context && this.options.context._user && this.options.context._user.connector, serverUrl = new Url(connector && connector.connection.url || location.href), link = NodeLinks.getHomeUrl(serverUrl);
      return link;
    },
    onClickHomeIcon: function(e) {
      if (base.isControlClick(e)) {} else {
        e.preventDefault();
        this.applicationScope.set("id", "");
      }
    },
    onKeydownHomeIcon: function(e) {
      if (e.keyCode === 32 || e.keyCode === 13) {
        this.onClickHomeIcon(e);
      }
    },
    _toggleVisibility: function() {
      if (!this._isRendered) return;
      const csuiLogo = this.ui.csuiLogo;
      if (!this.applicationScope.id) {
        csuiLogo.removeAttr("role");
        csuiLogo.removeAttr("data-href");
        this.ui.csuiLogo.css("cursor", "auto");
        csuiLogo.removeAttr("title");
        csuiLogo.removeAttr("aria-label");
        csuiLogo.attr("tabindex", "-1");
      } else {
        csuiLogo.attr("role", "link");
        csuiLogo.attr("data-href", this.addLinkToIcon());
        this.ui.csuiLogo.css("cursor", "pointer");
        csuiLogo.attr("title", lang.Home);
        csuiLogo.attr("aria-label", lang.HomeIconAria);
        csuiLogo.attr("tabindex", "0");
      }
    },
    _cacheAssets: function() {
      const origin = this.user.connector?.getConnectionUrl()?.getOrigin(), supportPath = this.user.connector?.connection?.supportPath, concatenatedPath = supportPath ? origin.concat(supportPath) : origin;
      CacheAssets.forEach(element => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = element.as;
        link.href = `${concatenatedPath}/${element.href}`;
        $("head").append(link);
      });
    }
  });
  _.extend(NavigationHeaderView.prototype, LayoutViewEventsPropagationMixin);
  UpdateSupportAssetBrandingConfigMixin.mixin(NavigationHeaderView.prototype);
  return NavigationHeaderView;
});