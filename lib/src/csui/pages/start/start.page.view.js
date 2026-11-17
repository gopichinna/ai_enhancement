/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/routing", "csui/utils/contexts/perspective/perspective.context", "csui/utils/contexts/factories/connector", "csui/pages/start/perspective.routing", "csui/utils/base", "csui/pages/start/impl/navigationheader/navigationheader.view", "csui/controls/app.header/app.header.view", "i18n", "csui/controls/app.header/burger.menu/burger.menu", "csui/controls/perspective.panel/perspective.panel.view", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/non-emptying.region/non-emptying.region", "csui/utils/non-attaching.region/non-attaching.region", "csui/utils/page.leaving.blocker", "csui/controls/iconpreload/icon.preload.view", "csui/pages/error.page/error.page.view", "csui/perspective.manage/mixins/update.supportasset.branding.config.mixin", "csui/utils/contexts/factories/branding.config.factory", "csui/utils/namedlocalstorage", "csui/utils/log", "smart/themes/theming", "i18n!csui/pages/start/impl/nls/lang", "csui/utils/commonconfig.util", "css!csui/pages/start/impl/start.page" ], function(module, _, $, Backbone, Marionette, routing, PerspectiveContext, ConnectorFactory, PerspectiveRouting, base, CSUINavigationHeaderView, CSUINavHeaderView, i18n, BurgerMenuItems, PerspectivePanelView, ViewEventsPropagationMixin, TabablesBehavior, TabableRegionBehavior, NonEmptyingRegion, NonAttachingRegion, PageLeavingBlocker, IconPreloadView, ErrorPageView, UpdateSupportAssetBrandingConfigMixin, BrandingConfigFactory, NamedLocalStorage, log, theming, lang, CommonConfigUtil) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  let NavigationHeaderView = CSUINavigationHeaderView;
  var config = _.extend({
    useV2AppHeader: true,
    enableHamburger: true,
    signInPageUrl: "signin.html",
    redirectToSignInPage: !routing.routesWithSlashes(),
    enablePendo: CommonConfigUtil.enableFeatureInSmartView() || false
  }, module.config());
  config.useV2AppHeader && (NavigationHeaderView = CSUINavHeaderView);
  log = log(module.id);
  var StartPageView = Marionette.ItemView.extend({
    template: false,
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },
    constructor: function StartPageView(options) {
      options || (options = {});
      options.el = document.body;
      theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() && (NavigationHeaderView = CSUINavHeaderView);
      Marionette.View.prototype.constructor.call(this, options);
      var context = options.context || new PerspectiveContext();
      var connector = context.getObject(ConnectorFactory);
      this.context = context;
      this.namedLocalStorage = new NamedLocalStorage("pendoSettings");
      if (!connector.connection.credentials && !connector.authenticator.isAuthenticated() && !connector.authenticator.syncStorage().isAuthenticated() && !(connector.authenticator.interactive && connector.authenticator.interactive())) {
        if (!config.redirectToSignInPage) {
          this._showMissingCredentialsError();
        } else {
          this._navigateToSignIn();
        }
        return;
      }
      connector.authenticator.on("loggedOut", function(args) {
        if (args.reason === "failed") {
          this._navigateToSignIn();
        }
        localStorage.removeItem("shownSystemMsg");
        args.reason === "logged-out" && context.viewStateModel && context.viewStateModel.clean();
      }, this);
      this.brandingConfig = context.getModel(BrandingConfigFactory);
      if (CommonConfigUtil.enableJatoBranding()) {
        this.listenTo(this.brandingConfig, "change:theme", _.bind(this._createStyleSheetAndApplyBranding, this));
      }
      this.loadSupportAssetID();
      let navHeaderViewOpts = {
        context: context,
        connector: connector,
        signInPageUrl: this.options.signInPageUrl,
        transparent: true,
        rtl: i18n.settings.rtl,
        brandingConfig: this.brandingConfig,
        skipLinks: [ {
          attributes: {
            arialabel: lang.skipLinkAria,
            title: lang.skipLinkAria,
            href: "#content",
            target: "_self",
            id: "skipHeader"
          },
          execute: _.bind(function() {
            const headerBar = this.navigationHeader?.el?.querySelector(".smart-application-header");
            headerBar?.setAttribute("inert", "");
            const focusablesSelectors = "a[href]:not([tabindex='-1']), area[href]:not([tabindex='-1']), input:not([tabindex='-1']), select:not([tabindex='-1']), textarea:not([tabindex='-1']), otc-button:not([tabindex='-1']), button:not([tabindex='-1']), *[tabindex='0'], otc-typeahead-search:not([tabindex='-1'])," + " iframe:not([tabindex='-1']), object:not([tabindex='-1']), embed:not([tabindex='-1'])";
            const tabableElements = this.perspectivePanel.el?.querySelectorAll(focusablesSelectors);
            const tabableElementsArray = Array.from(tabableElements);
            const focusablesElements = tabableElementsArray.filter(function(element) {
              return $(element).is(":visible");
            });
            focusablesElements.length > 0 && $(focusablesElements[0]).trigger("focus");
          }, this)
        } ],
        enableHamburger: config.enableHamburger
      };
      this.navigationHeader = new NavigationHeaderView(navHeaderViewOpts);
      context.brandingConfigData = this.brandingConfig;
      this.navigationHeader.on("render", _.bind(function() {
        if (config.useV2AppHeader) {
          this.navigationHeader.brandingConfig = this.brandingConfig;
          this.navigationHeader.brandingConfigData = this.brandingConfig;
          this.listenTo(this.brandingConfig, "change:branding", _.bind(this._applyBrandingStyles, this));
          this.listenToOnce(this.navigationHeader, "render:header", _.bind(this._applyBrandingStyles, this));
          let skipLink = this.navigationHeader?.skipLinksCollectionView?.el?.querySelector("#skipHeader");
          !!skipLink && skipLink?.addEventListener("blur", _.bind(function(e) {
            let headerBar = this.navigationHeader?.el?.querySelector(".smart-application-header");
            headerBar?.removeAttribute("inert");
          }, this));
          this.listenTo(this.navigationHeader, "process:left:menu:item", _.bind(function(model) {
            let executeFun = model.get("execute");
            if (_.isFunction(executeFun)) {
              executeFun({
                context: this.context,
                menuItem: model
              });
            }
          }, this));
        }
      }, this));
      this.context = context;
      this.context.navigationHeaderView = this.navigationHeader;
      this.perspectivePanel = new PerspectivePanelView({
        context: context
      });
      this.listenTo(this.perspectivePanel, "before:start:perspective:loading", function() {
        this.el.classList.add("mouse-blocked");
      }).listenTo(this.perspectivePanel, "after:finish:perspective:loading", function() {
        this.el.classList.remove("mouse-blocked");
        this.navigationHeader.el.classList.remove("smart-app-header-hide");
      });
      if (this.options.applyFastTheme && this.perspectivePanel) {
        document.body.classList.add("csui-pre-loading");
        CommonConfigUtil.enableSideBar() && document.body.classList.add("csui-sidebar-enabled");
        this.listenToOnce(this.perspectivePanel, "before:start:perspective:loading", function() {});
        let isPerspectiveLoaded = false;
        this.listenToOnce(this.perspectivePanel, "after:finish:perspective:loading", function() {
          isPerspectiveLoaded = true;
          var preLoaderElement = this.options.preLoaderEle || "#csui-pre-loader";
          $("body > " + preLoaderElement).remove();
          document.body.classList.remove("csui-pre-loading");
          if (this.context?._applicationScope?.get("id") === "") {
            if (!this.navigationHeader.el.querySelector("otc-skiplinks")) {
              let tabableElements = this.navigationHeader.el.querySelectorAll("[tabindex='0']");
              let focusablesSelectors = _.filter(tabableElements, function(selector) {
                return $(selector).is(":visible");
              });
              $(focusablesSelectors[0]).trigger("focus");
            }
          }
        });
        this.listenToOnce(this.context, "groups:fetched", function() {
          let isAdmin = this._isAdmin();
          config.pendoSubscription && config.pendoInitDetails && this._addPendoScript(isAdmin);
          let isPendoConfigValid = config.enablePendo && config.pendoSubscription && config.hidePendoDetails && !this.namedLocalStorage.get("doNotShowAgain") && isAdmin;
          if (isPendoConfigValid) {
            const showModal = () => this.showPendoModal();
            if (isPerspectiveLoaded) {
              showModal();
            } else {
              this.listenToOnce(this.perspectivePanel, "after:finish:perspective:loading", showModal);
            }
          }
        }.bind(this));
      }
      this.propagateEventsToViews(this.navigationHeader, this.perspectivePanel);
      var routing = PerspectiveRouting.getInstance({
        context: context,
        urlCanChange: true
      });
      routing.start();
      this.$el.addClass("binf-widgets");
      if (base.isAppleMobile()) {
        this.$el.addClass("csui-on-ipad");
      }
      if (base.isIOSBrowser()) {
        this.$el.addClass("csui-on-macintosh");
      }
      require([ "csui/utils/accessibility" ], function(Accessibility) {
        Accessibility.isAccessibleMode() && this.$el.addClass("accessibility");
      }.bind(this));
      $(window).on("unload", function() {});
    },
    _addPendoScript: function(isAdmin) {
      let user = this.context._user;
      if (user.fetched && user.get("id")) {
        this._initPendo(user, isAdmin);
      } else {
        this.listenToOnce(user, "sync", _.bind(function() {
          this._initPendo(user, isAdmin);
        }, this));
      }
    },
    updatePendoInitData: function(object, user) {
      const results = {};
      for (var key in object) {
        if (typeof object[key] === "object" && object[key] !== null) {
          results[key] = this.updatePendoInitData(object[key], user);
        } else {
          results[key] = typeof object[key] === "string" && object[key].includes(".get") ? eval(object[key]) : object[key];
        }
      }
      return results;
    },
    _initPendo: function(user, isAdmin) {
      user.set("isAdmin", isAdmin, {
        silent: true
      });
      const apiKey = config.pendoSubscription;
      try {
        let pendoInitDetails = JSON.parse(config.pendoInitDetails);
        let data = this.updatePendoInitData(pendoInitDetails, user);
        const initPendo = data => {
          (function(apiKey, platformData) {
            (function(p, e, n, d, o) {
              var v, w, x, y, z;
              o = p[d] = p[d] || {};
              o._q = o._q || [];
              v = [ "initialize", "identify", "updateOptions", "pageLoad", "track" ];
              for (w = 0, x = v.length; w < x; ++w) (function(m) {
                o[m] = o[m] || function() {
                  o._q[m === v[0] ? "unshift" : "push"]([ m ].concat([].slice.call(arguments, 0)));
                };
              })(v[w]);
              y = e.createElement(n);
              y.async = !0;
              y.src = "https://cdn.pendo.io/agent/static/" + apiKey + "/pendo.js";
              z = e.getElementsByTagName(n)[0];
              z.parentNode.insertBefore(y, z);
            })(window, document, "script", "pendo");
            pendo.initialize(platformData);
          })(apiKey, data);
        };
        initPendo(data);
      } catch (error) {
        log.warn("Pendo Initialization failed.\n{0}", error.stack) && console.warn(log.last);
      }
    },
    _isAdmin: function() {
      let isAdmin = this.context._user.get("privilege_system_admin_rights") || false;
      if (!isAdmin) {
        _.each(this.context._groups, function(group) {
          isAdmin = !isAdmin ? group?.data?.properties?.name?.indexOf("Business Administrators") > -1 : isAdmin;
        });
      }
      return isAdmin;
    },
    showPendoModal: function() {
      let self = this;
      require([ "csui/dialogs/modal.alert/modal.alert", "csui/pages/start/pendo.dialog.view" ], function(ModalAlert, pendoDialogView, GlobalMessage) {
        let modal = new ModalAlert({
          title: lang.pendoHeaderTitle,
          modalClass: "csui-pendo-modal",
          bodyView: pendoDialogView,
          bodyViewOptions: {
            context: self.context
          },
          staticBackdrop: true,
          buttons: {
            showYes: false,
            showNo: false,
            showCancel: true,
            labelCancel: lang.closeButtonLabel
          }
        });
        modal.show();
      }, function(error) {
        require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
          GlobalMessage.showMessage("error", error.message);
        });
      });
    },
    _applyBrandingStyles: function() {
      let navigationHeaderView = this.navigationHeader;
      theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() && config?.useV2AppHeader && this.applyInvertColor();
      if (navigationHeaderView.options.isPerspectiveEdit) {
        const tempBrandingStylesheet = this._addBrandingStyling(navigationHeaderView.options.context?.previewBranding, true);
        const stylesheetID = "edit-branding-stylesheet";
        document.getElementById(stylesheetID)?.remove();
        const link = document.createElement("link");
        link.id = stylesheetID;
        link.rel = "stylesheet";
        link.href = tempBrandingStylesheet;
        $(".pman-mode-edit").append(link);
      } else {
        const cssUri = navigationHeaderView.brandingConfigData?.get("brandingCSS");
        this.loadBrandingCSSFile(cssUri);
      }
    },
    applyInvertColor: function() {
      const navigationHeaderView = this.navigationHeader;
      const brandSettingCodes = navigationHeaderView.brandingConfigData?.get("brandingSettingCodes");
      let theme = brandSettingCodes && brandSettingCodes.themes && brandSettingCodes.themes[theming.getTheme()];
      if (theme?.isInvertIconColor) {
        navigationHeaderView.$el.addClass("csui-app-header-invert");
      } else {
        navigationHeaderView.$el.removeClass("csui-app-header-invert");
      }
    },
    _createStyleSheetAndApplyBranding: function() {
      let navigationHeaderView = this.navigationHeader;
      const cssUri = this._addBrandingStyling(navigationHeaderView.options.context?.brandingConfigData, true);
      navigationHeaderView.brandingConfigData?.set("brandingCSS", cssUri);
      navigationHeaderView.brandingConfigData?.set("tempBrandingCSS", cssUri);
      this.loadBrandingCSSFile(cssUri);
      this._applyBrandingStyles();
      this.context.brandingConfigData?.trigger("change:brand");
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
    _addBrandingStyling: function(config, hardApply) {
      if (!config) return;
      this.createBrandingStyleSheet = theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() ? this.createStyleSheetForJatoTheme : this.createStyleSheet;
      const brandingSettingCodes = config.get("brandingSettingCodes");
      this.createBrandingStyleSheet = theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() && brandingSettingCodes?.themes ? this.createStyleSheetForJatoTheme : this.createStyleSheet;
      const brandingConfigCSSUri = this.createBrandingStyleSheet(brandingSettingCodes, hardApply);
      return brandingConfigCSSUri;
    },
    loadSupportAssetID: function() {
      const deferred = $.Deferred();
      this.createBrandingStyleSheet = theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() ? this.createStyleSheetForJatoTheme : this.createStyleSheet;
      this.getDetailsForBrandingConfig().done(response => {
        const brandingSettingCodes = response?.data?.brandingSettingCodes;
        this.createBrandingStyleSheet = theming.isJATOTheme() && CommonConfigUtil.enableJatoBranding() && brandingSettingCodes?.themes ? this.createStyleSheetForJatoTheme : this.createStyleSheet;
        if (brandingSettingCodes) {
          const brandingConfigCSSUri = this.createBrandingStyleSheet(brandingSettingCodes);
          response.data.brandingCSS = brandingConfigCSSUri ?? "";
          response.data.tempBrandingCSS = brandingConfigCSSUri ?? "";
        }
        if (isJato() && CommonConfigUtil.enableJatoBranding() && brandingSettingCodes?.themes) {
          response.data.logoSrc = response.data.brandingSettingCodes.themes[theming.getTheme()].brandLogoUri;
        } else {
          response.data.logoSrc = response.data.brandLogoUri;
        }
        this.brandingConfig.set(response.data);
        this.navigationHeader.trigger("render:header");
        return deferred.resolve("Success");
      }).fail(error => {
        return deferred.reject(error);
      });
      return deferred.promise();
    },
    onRender: function() {
      if (this._redirecting) {
        return this;
      }
      IconPreloadView.ensureOnThePage();
      config?.useV2AppHeader && this.navigationHeader.el.classList.add("smart-app-header-hide");
      this._appendView(this.navigationHeader);
      this._appendView(this.perspectivePanel);
      this.$el.children(".cs-perspective-panel").attr("role", "main");
      setTimeout(_.bind(function() {
        var bodyRegion = new NonAttachingRegion({
          el: this.el
        });
        bodyRegion.show(this, {
          render: false
        });
      }, this));
      this.$el.on("globalmessage.shown", function(event, view) {
        var messageTabable = new TabableRegionBehavior(view.options, view);
      });
    },
    onBeforeDestroy: function() {
      this.navigationHeader && this.navigationHeader.destroy();
      this.perspectivePanel && this.perspectivePanel.destroy();
    },
    _appendView: function(view) {
      var region = new NonEmptyingRegion({
        el: this.el
      });
      region.show(view);
    },
    _navigateToSignIn: function() {
      if (!config.redirectToSignInPage) {
        PageLeavingBlocker.forceDisable();
        location.reload();
      } else {
        var signInPageUrl = this.options.signInPageUrl || config.signInPageUrl, query = location.search;
        query += query ? "&" : "?";
        query += "nextUrl=" + encodeURIComponent(location.pathname);
        location.href = signInPageUrl + query + location.hash;
      }
      this._redirecting = true;
    },
    _showMissingCredentialsError: function() {
      var errorModel = new Backbone.Model({
        message: "The StartPageView was created without providing valid authentication data.",
        hideNavigationButtons: true,
        errorCode: 401,
        showLogout: false
      }), errorPageView = new ErrorPageView({
        model: errorModel
      });
      errorPageView.render();
    }
  }, {
    useV2AppHeader: config.useV2AppHeader ?? false,
    enableHamburger: config.enableHamburger ?? false
  });
  _.extend(StartPageView.prototype, ViewEventsPropagationMixin);
  UpdateSupportAssetBrandingConfigMixin.mixin(StartPageView.prototype);
  return StartPageView;
});