/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "dctmw/utils/rest.resources", "d2/utils/theme/theme.config.factory" ], function($, RestResources, ThemeConfigModelFactory) {
  "use strict";
  var SIGNIN_PAGE_LOGO_HEIGHT = 108, LANDING_PAGE_LOGO_HEIGHT = 40, ELEMENT_SELECTOR = Object.freeze({
    APP_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin)",
    GLOBAL_ERROR_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-global-error",
    HEADER_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar.binf-navbar",
    HEADER_LOGO: ".binf-widgets.d2-themed:not(.app-module-signin) .perspective-module-view .binf-navbar-brand > .csui-logo > .csui-logo-image",
    HEADER_SEARCH: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .binf-navbar-nav .search-container .search-wrapper .textbox",
    HEADER_SEARCH_TEXT_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .search-container .search-wrapper .i-search div",
    HEADER_SEARCH_CLEAR_TEXT_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .binf-navbar-nav .search-container .search-wrapper .i-close",
    HEADER_SEARCH_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .binf-navbar-nav .search-container .search-wrapper .transitional-content",
    HEADER_SEARCH_PLACEHOLDER: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .binf-navbar-nav .search-container .search-wrapper .transitional-content .text-placeholder",
    HEADER_HOME_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .binf-navbar .csui-icon-home",
    HEADER_SEARCH_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-navbar .binf-navbar-nav .d2-search-box .d2-search-interaction .d2-search-button",
    HEADER_FAV_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .favorite_header_icon",
    HEADER_FAV_ICON_SELECTED: ".binf-widgets.d2-themed:not(.app-module-signin) .showing-favorites-view .favorite_header_icon",
    HEADER_PROFILE_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .csui-profile .csui-navbar-icons span",
    HEADER_BREADCRUMB_BUTTON: ".binf-widgets.d2-themed:not(.app-module-signin) .binf-navbar-nav .tile-breadcrumb .binf-btn",
    HEADER_BREADCRUMB_BUTTON_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .binf-navbar-nav .tile-breadcrumb .breadcrumbs-handle .csui-button-icon",
    D2_HEADER_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar",
    D2_HEADER_LOGO: '.binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .binf-container-fluid[role="menubar"] .binf-navbar-nav .d2-branding .d2-brand-container .d2-brand-logo',
    D2_HEADER_SEARCH: '.binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .binf-container-fluid[role="menubar"] .binf-navbar-nav .search-container .search-wrapper .textbox',
    D2_HEADER_SEARCH_TEXT_ICON: ".binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .search-container .search-wrapper .i-search div",
    D2_HEADER_SEARCH_CLEAR_TEXT_ICON: '.binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .binf-container-fluid[role="menubar"] .binf-navbar-nav .search-container .search-wrapper .i-close',
    D2_HEADER_SEARCH_BACKGROUND: '.binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .binf-container-fluid[role="menubar"] .binf-navbar-nav .search-container .search-wrapper .transitional-content',
    D2_HEADER_SEARCH_PLACEHOLDER: '.binf-widgets.d2-themed:not(.app-module-signin) .d2-navbar .binf-container-fluid[role="menubar"] .binf-navbar-nav .search-container .search-wrapper .transitional-content .text-placeholder',
    BREADCRUMB_BACKGROUND: ".binf-widgets.d2-themed:not(.app-module-signin) #breadcrumb-wrap .breadcrumb-inner",
    BREADCRUMB_TEXT: ".binf-widgets.d2-themed:not(.app-module-signin) #breadcrumb-wrap .binf-breadcrumb a",
    BREADCRUMB_ACTIVE_TEXT: ".binf-widgets.d2-themed:not(.app-module-signin) #breadcrumb-wrap .binf-breadcrumb > li.binf-active",
    LOGIN_BACKGROUND: ".binf-widgets.d2-themed.app-module-signin",
    LOGIN_MSG: ".binf-widgets.d2-themed.app-module-signin .login-error",
    LOGIN_COPYRIGHT_MSG: ".binf-widgets.d2-themed.app-module-signin .signin-copyright",
    LOGIN_LOGO: ".binf-widgets.d2-themed.app-module-signin .signin-header .d2-logo"
  }), DEFAULT_GRADIENT_ATTRIBUTES = Object.freeze({
    START_COLOR: "090E2C",
    END_COLOR: "078DB3",
    MIDDLE_COLOR: "122C69",
    DEGREE: 61
  }), COLOR_TYPES = Object.freeze({
    SINGLE: "single",
    GRADIENT: "gradient"
  });
  return {
    getDefaultThemeModel: function(context) {
      return context.getModel(ThemeConfigModelFactory, {
        attributes: {
          _key: "default"
        },
        options: {
          type: "signin_page"
        },
        permanent: true,
        detached: true
      });
    },
    getUserThemeModel: function(context) {
      return context.getModel(ThemeConfigModelFactory, {
        attributes: {
          _key: "user"
        },
        options: {
          type: "landing_page"
        },
        permanent: true,
        detached: true
      });
    },
    initAppPageStyles: function(context) {
      this.initUserPageStyles(context);
      this.initSignInPageStyles(context);
    },
    initUserPageStyles: function(context) {
      var me = this, themeConfigModel = me.getUserThemeModel(context), styleElement = document.createElement("style");
      document.head.appendChild(styleElement);
      themeConfigModel.styleSheet = styleElement.sheet;
      themeConfigModel.on("change", function() {
        if (themeConfigModel.get("r_object_id")) {
          themeConfigModel.styleSheet.disabled = false;
          me.applicationRule(themeConfigModel);
          me.headerRule(themeConfigModel);
          me.breadcrumbRule(themeConfigModel);
        } else {
          themeConfigModel.styleSheet.disabled = true;
        }
      });
      if (themeConfigModel.get("r_object_id")) {
        me.applicationRule(themeConfigModel);
        me.headerRule(themeConfigModel);
        me.breadcrumbRule(themeConfigModel);
      }
    },
    initSignInPageStyles: function(context) {
      var me = this, themeConfigModel = me.getDefaultThemeModel(context), styleElement = document.createElement("style");
      document.head.appendChild(styleElement);
      themeConfigModel.styleSheet = styleElement.sheet;
      themeConfigModel.on("change", function() {
        if (themeConfigModel.get("r_object_id")) {
          themeConfigModel.styleSheet.disabled = false;
          me.loginInRule(themeConfigModel);
        } else {
          themeConfigModel.styleSheet.disabled = true;
        }
      });
      if (themeConfigModel.get("r_object_id")) {
        me.loginInRule(themeConfigModel);
      }
    },
    applicationRule: function(themeConfigModel) {
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.APP_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "application"), true));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.GLOBAL_ERROR_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "application"), true));
    },
    headerRule: function(themeConfigModel) {
      var me = this, d2Header = themeConfigModel.get("_searchFocusedHeader");
      if (d2Header) {
        var checkHeaderDefaultColor = themeConfigModel.get("header_color_type") === COLOR_TYPES.GRADIENT && themeConfigModel.get("header_gradient_start") === DEFAULT_GRADIENT_ATTRIBUTES.START_COLOR && themeConfigModel.get("header_gradient_end") === DEFAULT_GRADIENT_ATTRIBUTES.END_COLOR && themeConfigModel.get("header_gradient_degree") === DEFAULT_GRADIENT_ATTRIBUTES.DEGREE, checkAppBgDefaultColor = themeConfigModel.get("application_color_type") === COLOR_TYPES.GRADIENT && themeConfigModel.get("application_gradient_start") === DEFAULT_GRADIENT_ATTRIBUTES.START_COLOR && themeConfigModel.get("application_gradient_end") === DEFAULT_GRADIENT_ATTRIBUTES.END_COLOR && themeConfigModel.get("application_gradient_degree") === DEFAULT_GRADIENT_ATTRIBUTES.DEGREE;
        if (checkHeaderDefaultColor) {
          if (!checkAppBgDefaultColor) {
            this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "header")));
          }
        } else {
          this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "header")));
        }
        if (themeConfigModel.get("header_logo") != null && themeConfigModel.get("header_logo").toLowerCase() !== "default_logo") {
          this.getLogoBackgroundSize(themeConfigModel.get("header_logo"), LANDING_PAGE_LOGO_HEIGHT).done(function(backgroundSize) {
            me.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_LOGO, me.logoRule(themeConfigModel.get("header_logo")), me.logoBackgroundSizeRule(backgroundSize));
          });
        }
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_SEARCH, this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_SEARCH_TEXT_ICON + "::before", this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_SEARCH_CLEAR_TEXT_ICON + "::before", this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_SEARCH_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "search")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.D2_HEADER_SEARCH_PLACEHOLDER, this.colorRule(themeConfigModel.get("search_text_color")));
      } else {
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "header")));
        if (themeConfigModel.get("header_logo") != null && themeConfigModel.get("header_logo").toLowerCase() !== "default_logo") {
          this.getLogoBackgroundSize(themeConfigModel.get("header_logo"), LANDING_PAGE_LOGO_HEIGHT).done(function(backgroundSize) {
            me.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_LOGO, me.logoRule(themeConfigModel.get("header_logo")), me.logoBackgroundSizeRule(backgroundSize));
          });
        }
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH, this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_TEXT_ICON + "::before", this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_CLEAR_TEXT_ICON + "::before", this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "search")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_PLACEHOLDER, this.colorRule(themeConfigModel.get("search_text_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_HOME_ICON + "::before", this.colorRule(themeConfigModel.get("header_icon_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_ICON, this.borderRule(1, themeConfigModel.get("header_icon_border_inactive")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_ICON + "::before", this.colorRule(themeConfigModel.get("header_icon_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_SEARCH_ICON + ":hover", this.borderRule(1, themeConfigModel.get("header_icon_border_active")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_BREADCRUMB_BUTTON, this.colorRule(themeConfigModel.get("header_icon_color")));
        this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_BREADCRUMB_BUTTON_ICON + "::before", this.colorRule(themeConfigModel.get("header_icon_color")));
      }
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_FAV_ICON, this.borderRule(1, themeConfigModel.get("header_icon_border_inactive")));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_FAV_ICON + "::before", this.colorRule(themeConfigModel.get("header_icon_color")));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.HEADER_FAV_ICON + ":hover", this.borderRule(1, themeConfigModel.get("header_icon_border_active")));
    },
    breadcrumbRule: function(themeConfigModel) {
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.BREADCRUMB_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "breadcrumb")), this.opacityRule(1));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.BREADCRUMB_TEXT, this.colorRule(themeConfigModel.get("breadcrumb_text_color")));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.BREADCRUMB_ACTIVE_TEXT, this.colorRule(themeConfigModel.get("breadcrumb_text_color")));
    },
    loginInRule: function(themeConfigModel) {
      var me = this;
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.LOGIN_BACKGROUND, this.backgroundRule(this.getBackgroundConfig(themeConfigModel, "login"), true));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.LOGIN_MSG, this.colorRule(themeConfigModel.get("login_text_color")));
      this.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.LOGIN_COPYRIGHT_MSG, this.colorRule(themeConfigModel.get("login_text_color")));
      if (themeConfigModel.get("header_logo") != null && themeConfigModel.get("header_logo").toLowerCase() !== "default_logo") {
        this.getLogoBackgroundSize(themeConfigModel.get("header_logo"), SIGNIN_PAGE_LOGO_HEIGHT).done(function(backgroundSize) {
          me.insertStyleRule(themeConfigModel.styleSheet, ELEMENT_SELECTOR.LOGIN_LOGO, me.logoRule(themeConfigModel.get("header_logo")), me.logoBackgroundSizeRule(backgroundSize));
        });
      }
    },
    insertStyleRule: function() {
      var styleSheet = arguments[0];
      var styleRuleName = arguments[1];
      var styleRules = Array.prototype.slice.call(arguments, 2);
      if (styleRules.length > 0) {
        var cssClass = styleRuleName + "{";
        for (var styleRule in styleRules) {
          if (Object.prototype.hasOwnProperty.call(styleRules, styleRule)) {
            var rule = styleRules[styleRule];
            if (rule.length > 0) {
              cssClass = cssClass + rule + ";";
            }
          }
        }
        cssClass = cssClass + "}";
        styleSheet.insertRule(cssClass, styleSheet.cssRules.length);
      }
    },
    backgroundRule: function(background, norepeat) {
      var rule = "";
      if (background.colorType === COLOR_TYPES.SINGLE && background.color.length > 0) {
        rule = "background: #" + background.color + " !important";
      } else if (background.colorType === COLOR_TYPES.GRADIENT && background.gradientStart.length > 0 && background.gradientEnd.length > 0) {
        var gradientStart = background.gradientStart;
        var gradientEnd = background.gradientEnd;
        var gradientMiddle = background.gradientMiddle;
        var repeatRule = "";
        if (norepeat) {
          repeatRule = "no-repeat fixed";
        }
        if (gradientMiddle) {
          rule = "background: linear-gradient(" + background.gradientDegree + "deg, #" + gradientStart + " 0%, #" + gradientMiddle + " 59%, #" + gradientEnd + " 100%) " + repeatRule + " !important";
        } else {
          rule = "background: linear-gradient(" + background.gradientDegree + "deg, #" + gradientStart + ", #" + gradientEnd + ") " + repeatRule + " !important";
        }
      }
      return rule;
    },
    colorRule: function(color) {
      var rule = "";
      if (color.length > 0) {
        rule = "color: #" + color + " !important";
      }
      return rule;
    },
    backgroundColorRule: function(color) {
      var rule = "";
      if (color.length > 0) {
        rule = "background-color: #" + color + " !important";
      }
      return rule;
    },
    logoRule: function(imageData) {
      return "background-image: url(" + imageData + ") !important";
    },
    logoBackgroundSizeRule: function(size) {
      return "background-size: " + size + " !important";
    },
    opacityRule: function(opacity) {
      return "opacity: " + opacity + " !important";
    },
    borderRule: function(width, color) {
      var rule = "";
      if (color.length > 0) {
        rule = "border: " + width + "px solid #" + color + " !important";
      }
      return rule;
    },
    borderColorRule: function(color) {
      var rule = "";
      if (color.length > 0) {
        rule = "border-color: #" + color + " !important";
      }
      return rule;
    },
    getBackgroundConfig: function(themeConfigModel, context) {
      var gradientMiddleColor;
      if ((context === "login" || context === "application" || context === "header") && themeConfigModel.get(context + "_gradient_start") === DEFAULT_GRADIENT_ATTRIBUTES.START_COLOR && themeConfigModel.get(context + "_gradient_end") === DEFAULT_GRADIENT_ATTRIBUTES.END_COLOR && themeConfigModel.get(context + "_gradient_degree") === DEFAULT_GRADIENT_ATTRIBUTES.DEGREE) {
        gradientMiddleColor = DEFAULT_GRADIENT_ATTRIBUTES.MIDDLE_COLOR;
      }
      return {
        colorType: themeConfigModel.get(context + "_color_type"),
        color: themeConfigModel.get(context + "_color"),
        gradientStart: themeConfigModel.get(context + "_gradient_start"),
        gradientMiddle: gradientMiddleColor ? gradientMiddleColor : "",
        gradientEnd: themeConfigModel.get(context + "_gradient_end"),
        gradientDegree: themeConfigModel.get(context + "_gradient_degree")
      };
    },
    getLogoBackgroundSize: function(logoData, maxHeight) {
      var deferred = $.Deferred(), img = $("<img>");
      img.attr("src", logoData);
      img.addClass("temp_logo_image");
      img.hide();
      img.on("load", function() {
        $(this);
        $("body").append(img);
        var imageHeight = img.height();
        $(".temp_logo_image").remove();
        var logoSize = "auto";
        if (imageHeight > maxHeight) {
          logoSize = "contain";
        }
        deferred.resolve(logoSize);
      });
      return deferred.promise();
    }
  };
});