/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "nuc/utils/log", "i18n", "smart/themes/theming", "dctmw/pages/app/app.modules", "dctmw/utils/utils", "dctmw/utils/theme/theme.config.manager", "dctmw/utils/idle.detection", "css!dctmw/pages/app/impl/application", "smart/lib/binf/js/binf", "smart/utils/otwc.loader", "css!dctmw/utils/theme/jato/jato.tokens" ], function(module, require, _, $, Marionette, base, log, i18n, SmartTheming, Modules, utils, ThemeConfigManager, detectIdle) {
  "use strict";
  log = log(module.id);
  function adjustToFlowDirection(value) {
    return (i18n.settings.rtl ? -1 : 1) * value;
  }
  const svgContent = "PHN2ZyBjbGFzcz0ic3Bpbm5lciBzcGlubmVyLWlubmVyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MyIgaGVpZ2h0PSI3MyIgdmlld0JveD0iMCAwIDczIDczIiBmaWxsPSIjRkZGRkZGIiBzdHlsZT0iIj4KICAgICAgICA8cGF0aCBkPSJNMzYuNSA4Ljc5NzUyQzUxLjc4NzQgOC43OTc1MiA2NC4yMDI1IDIxLjIxMjYgNjQuMjAyNSAzNi41QzY0LjIwMjUgNTEuNzg3NCA1MS43ODc0IDY0LjIwMjUgMzYuNSA2NC4yMDI1QzIxLjIxMjYgNjQuMjAyNSA4Ljc5NzUzIDUxLjc4NzQgOC43OTc1MyAzNi41QzguNzk3NTMgMjEuMjEyNiAyMS4yMTI2IDguNzk3NTIgMzYuNSA4Ljc5NzUyWk03Mi41IDM2LjVDNzIuNSAxNi42MyA1Ni4zNyAwLjUgMzYuNSAwLjVDMTYuNjMgMC41IDAuNDk5OTk5IDE2LjYzIDAuNDk5OTk5IDM2LjVDMC40OTk5OTkgNTYuMzcgMTYuNjMgNzIuNSAzNi41IDcyLjVDNTYuMzcgNzIuNSA3Mi41IDU2LjM3IDcyLjUgMzYuNVoiIGZpbGw9IiNGRkZGRiIgc3R5bGU9ImZpbGw6I0ZGRkZGRjtmaWxsOmNvbG9yKGRpc3BsYXktcDMgMC44MTE4IDAuODYyNyAwLjk4ODIpO2ZpbGwtb3BhY2l0eToxO2JhY2tncm91bmQ6IHJlYmVjY2FwdXJwbGU7Ij48L3BhdGg+CiAgICAgICAgPGNsaXBQYXRoIGlkPSJkY3Rtd19pbml0X2xvYWRlciI+CiAgICAgICAgICA8cGF0aCBkPSJNNDAuNjQ4OCA0LjY0ODc2QzQwLjY0ODggMi4zNTc0NiAzOC43OTEzIDAuNSAzNi41IDAuNUMxNi42MyAwLjUgMC41MDAwMDcgMTYuNjMgMC41MDAwMDcgMzYuNUMwLjUwMDAwNyA1Ni4zNyAxNi42MyA3Mi41IDM2LjUgNzIuNUM1Ni4zNyA3Mi41IDcyLjUgNTYuMzcgNzIuNSAzNi41QzcyLjUgMzQuMjA4NyA3MC42NDI1IDMyLjM1MTIgNjguMzUxMiAzMi4zNTEyQzY2LjA1OTkgMzIuMzUxMiA2NC4yMDI1IDM0LjIwODcgNjQuMjAyNSAzNi41QzY0LjIwMjUgNTEuNzg3NCA1MS43ODc0IDY0LjIwMjUgMzYuNSA2NC4yMDI1QzIxLjIxMjYgNjQuMjAyNSA4Ljc5NzUzIDUxLjc4NzQgOC43OTc1MyAzNi41QzguNzk3NTMgMjEuMjEyNiAyMS4yMTI2IDguNzk3NTIgMzYuNSA4Ljc5NzUyQzM4Ljc5MTMgOC43OTc1MiA0MC42NDg4IDYuOTQwMDYgNDAuNjQ4OCA0LjY0ODc2WiIgc3R5bGU9IiI+PC9wYXRoPgogICAgICAgIDwvY2xpcFBhdGg+CiAgICAgICAgPGZvcmVpZ25PYmplY3Qgd2lkdGg9IjczIiBoZWlnaHQ9IjczIiBjbGlwLXBhdGg9InVybCgjZGN0bXdfaW5pdF9sb2FkZXIpIj4KICAgICAgICAgIDxkaXYgY2xhc3M9InNwaW5uZXItZ3JhZGllbnQiPjwvZGl2PgogICAgICAgIDwvZm9yZWlnbk9iamVjdD4KICAgICAgPC9zdmc+";
  var $elBusy = $(`<div class="d2-init-loader-container"><div class="d2-init-loader-outer-border"><div class="d2-init-loader">${atob(svgContent)}</div></div></div>`);
  if (utils.isMobile()) {
    $elBusy.addClass("d2-mob");
  }
  var D2ShellRegion = Marionette.Region.extend({
    el: "body",
    viewStack: [],
    constructor: function D2ShellRegion(options) {
      options = options || {};
      D2ShellRegion.__super__.constructor.call(this, options);
      var classNames = "application binf-widgets";
      if (base.isAppleMobile()) {
        classNames += " csui-on-ipad";
      }
      if (utils.isMobile()) {
        classNames += " d2mob d2-mobile csui-mobile csmob-browser-platform";
        if (base.isAppleMobile()) {
          classNames += " d2mob-saf-ios";
        } else {
          classNames += " d2mob-gc-android";
        }
        if (!utils.isAppworks()) {
          classNames += " d2-mobile-browser";
        }
      }
      this._lastModuleContainerCssClass = "app-module-" + this._calculateModuleSuffix();
      classNames += " " + this._lastModuleContainerCssClass;
      this.$el.empty().addClass(classNames);
      this.$elModalHost = $.fn.binf_modal.getDefaultContainer();
    },
    _calculateModuleSuffix: function() {
      var possibleModule = (window.location.hash.match(/^#[^\?\/]+/) || [ "" ])[0].replace("#", "");
      if (possibleModule === "") {
        possibleModule = "default";
      }
      return possibleModule;
    },
    show: function(view, options) {
      options = options || {};
      this._showingModule = options.module;
      if (options.module && !this._idleDetectorStarted) {
        this._idleDetectorStarted = true;
        detectIdle();
      }
      if (this.currentView !== view) {
        _.extend(options, {
          render: !view._isRendered
        });
        D2ShellRegion.__super__.show.call(this, view, options);
      }
    },
    empty: function(options) {
      options = options || {};
      _.extend(options, {
        preventDestroy: true
      });
      var view = this.currentView;
      if (view) {
        this.lastView = view;
        D2ShellRegion.__super__.empty.call(this, options);
      }
    },
    attachHtml: function(view) {
      var width = this.$el.width(), $primaryEl, $secondaryEl, moduleSuffix = this._showingModule && this._showingModule.getName() || this._calculateModuleSuffix(), $swapInParent = view.$el.parent(".app-module"), $swapOutParent = this.lastView && this.lastView.$el.parent(".app-module"), animationDirectionFromEnd = true;
      if ($swapInParent.length === 0) {
        $swapInParent = view.$el.wrap('<div class="app-module"></div>').parent();
      }
      var moduleClass = "module-" + moduleSuffix, moduleContainerCssClass = "app-module-" + moduleSuffix;
      if (!$swapInParent.hasClass(moduleClass)) {
        $swapInParent.addClass(moduleClass);
      }
      if (this._lastModuleContainerCssClass !== moduleContainerCssClass) {
        this.$el.addClass(moduleContainerCssClass).removeClass(this._lastModuleContainerCssClass);
        this._lastModuleContainerCssClass = moduleContainerCssClass;
      }
      $swapInParent.removeClass("binf-hidden");
      if (animationDirectionFromEnd) {
        $swapInParent.css({
          left: 0,
          "z-index": 1
        });
        $primaryEl = $swapInParent;
        $secondaryEl = $swapOutParent;
      } else {
        if (this.lastView) {
          $swapOutParent.css({
            "z-index": 1
          });
          $primaryEl = $swapOutParent;
        }
        $swapInParent.css({
          left: adjustToFlowDirection(width * -.1)
        });
        $secondaryEl = $swapInParent;
      }
      !$.contains(this.$el, this.$elModalHost) && this.$el.prepend(this.$elModalHost);
      $swapInParent.insertAfter(this.$elModalHost);
      this.animating = true;
      $primaryEl.animate({
        left: adjustToFlowDirection(animationDirectionFromEnd ? 0 : width * .8)
      }, {
        duration: this.lastView ? 300 : 0,
        progress: function(promise, progress) {
          $secondaryEl && $secondaryEl.css({
            left: adjustToFlowDirection(width * -.1 * (animationDirectionFromEnd ? progress : 1 - progress))
          });
        }.bind(this),
        complete: function() {
          if (this.lastView) {
            this.lastView.triggerMethod("deactivated");
            $swapOutParent.addClass("binf-hidden");
            $swapOutParent.detach();
            delete this.lastView;
          }
          $swapInParent.css({
            "z-index": ""
          });
          this.raiseViewActivationEvent(view);
          setTimeout(function() {
            this.animating = false;
          }.bind(this), 0);
        }.bind(this)
      });
    },
    raiseViewActivationEvent: function(view) {
      (view || this.currentView).triggerMethod("activated");
    }
  });
  var D2Application = Marionette.Application.extend({
    regions: {
      shell: {
        el: "body",
        regionClass: D2ShellRegion
      }
    },
    constructor: function D2Application(options) {
      options = options || {};
      options.channelName = "application";
      D2Application.__super__.constructor.call(this, options);
    },
    onStart: function() {
      this.showLoader();
      require([ "csui/utils/content.helper" ], function() {
        require([ "dctmw/pages/app/application.context", "dctmw/utils/authenticators/session" ], function(ApplicationContext, Session) {
          require([ "dctmw/utils/overrides" ], () => {
            this.options.context = this.context = new ApplicationContext();
            this.session = Session.get(this.options);
            this.listenTo(this.session, "error", this.showError);
            this.session.init().always(function() {
              if (!SmartTheming.isJATOTheme()) {
                ThemeConfigManager.initAppPageStyles(this.context);
              }
              this.getRegion("shell").$el.addClass("d2-themed");
              $(this.options.global || window).on("unload", function() {
                Modules.destroyAll();
              });
              Modules.loadAndStart(this.options);
            }.bind(this));
          }, this.showError.bind(this));
        }.bind(this), this.showError.bind(this));
      }.bind(this), this.showError.bind(this));
    },
    showError: function(error) {
      if (error) {
        error = _.isString(error) ? {
          errorMsg: error
        } : _.isObject(error) ? error : {};
        this.hideLoader();
        require([ "dctmw/pages/error/start.page.error.view" ], function(ErrorView) {
          this.errorView = new ErrorView(_.extend(error, _.omit(this.options, "app")));
          this.getRegion("shell").show(this.errorView);
        }.bind(this));
      }
    },
    showLoader: function() {
      if ($elBusy && !$elBusy.parent().length) {
        this.getRegion("shell").$el.append($elBusy);
      }
    },
    hideLoader: function() {
      var $eBusy = this.getRegion("shell").$el.find(">.d2-init-loader-container").detach();
      if ($eBusy.length) {
        $elBusy = $eBusy;
      }
    },
    activateModule: function(module) {
      var me = this, view = module.getView();
      function showView() {
        log.debug("Activating view from module: {0}", module.getName()) && console.log(log.last);
        me.hideLoader();
        me.getRegion("shell").show(view, {
          module: module
        });
        me.errorView && me.errorView.destroy();
      }
      if (module) {
        if (view instanceof Marionette.View) {
          try {
            showView();
            return true;
          } catch (e) {
            console.error(e);
            log.warn("View display error for module: {0}", module.getName()) && console.log(log.last);
          }
        }
      }
      return false;
    }
  });
  var app;
  function appStart(options) {
    if (!app) {
      app = new D2Application();
      _.extend(app.options, options, {
        app: app
      });
      app.start();
    } else {
      log.warn("Application already running") && console.log(log.last);
    }
  }
  return {
    start: appStart
  };
});