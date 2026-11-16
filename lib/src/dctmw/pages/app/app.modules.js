/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "dctmw/utils/client.location", "dctmw/pages/app/impl/module.error.view", "i18n!dctmw/pages/app/impl/nls/lang", "dctm-ext!dctmw/pages/app/modules", "dctmw/lib/str-polyfill" ], function(module, require, _, $, parseParam, Backbone, Marionette, log, clientLocation, ModuleErrorView, lang, extraModules) {
  "use strict";
  log = log(module.id);
  var DEFAULT_ROUTE_PATTERN1 = "(/)(?*qp)", DEFAULT_ROUTE_PATTERN2 = "(*pp)(/)(?*qp)", DEFAULT_ROUTE_PATTERNS = [ DEFAULT_ROUTE_PATTERN1, DEFAULT_ROUTE_PATTERN2 ], pendingNavigation = [], relativeRoutingRoot = "", _sessionReloading = false;
  var ModuleRouter = Backbone.Router.extend({
    constructor: function ModuleRouter(options) {
      options = options || {};
      this.module = options.module;
      this.session = options.session;
      ModuleRouter.__super__.constructor.call(this, options);
      if (!Object.prototype.hasOwnProperty.call(this.module.routes, "")) {
        this.module.routes[""] = "defaultViewState";
      }
      var defaultViewState = this.module.routes[""];
      delete this.module.routes[""];
      this.module.routes[DEFAULT_ROUTE_PATTERN1] = defaultViewState;
      this.module.routes[DEFAULT_ROUTE_PATTERN2] = defaultViewState;
      _.chain(_.keys(this.module.routes)).sortBy(function(r) {
        return r.split("/").length;
      }).map(function(route) {
        return {
          origRoute: route,
          normalizedRoute: this.normalizeRoute(this.module.basePath, route)
        };
      }.bind(this)).reverse().each(function(entry) {
        this.route(entry.normalizedRoute, entry.origRoute, this.module.onRoute);
      }.bind(this));
    },
    normalizeRoute: function() {
      var url = _.reduce(Array.prototype.slice.call(arguments, 1), function(last, current) {
        last = last.replace(/\/$/, "").replace(/\(\/$/, "");
        current = current.replace(/^\//, "");
        if (current.startsWith("(/")) {
          return last + current;
        } else {
          return last + "/" + current;
        }
      }, arguments[0]);
      url.replace(/\/\//g, "/").replace(/\/$/, "(/)").replace(/^\//, "");
      return url;
    },
    execute: function(callback, args, name) {
      if (this.module.requiresSession === false || this.session.isActive()) {
        if (this.module.requiresSession !== false && _sessionReloading === true) {
          _sessionReloading = false;
          clientLocation.reload();
          return;
        }
        var aargs = [ name ].concat(args);
        return callback && callback.apply(this.module, aargs);
      } else {
        pendingNavigation.splice(0, 1, {
          fragment: this.module.basePath + (args.length === 3 && _.isString(args[0]) && !_.isEmpty(args[0]) ? "/" + args[0] : ""),
          hashParams: parseParam(args[args.length - 2])
        });
        this.module.trigger("routing:hold");
        this.session.start().done(() => {
          this.module.trigger("routing:release");
          var autoRoute = pendingNavigation.pop();
          autoRoute && clientLocation.navigate(autoRoute.fragment, {
            trigger: true,
            replace: true,
            keepHashParams: true
          });
        });
        return false;
      }
    },
    navigate: function(fragment, options) {
      clientLocation.navigate(fragment, options);
      return this;
    }
  });
  var Module = Marionette.Object.extend({
    constructor: function Module(options, viewOptions) {
      options = options || {};
      Module.__super__.constructor.call(this, options);
      this.viewOptions = viewOptions || _.omit(options, "basePath", "name", "routes", "view", "app");
      this.basePath = options.basePath;
      this.name = (options.name || this.basePath).replace(/[\W\s]+/g, "");
      this.routes = options.routes;
      this.view = options.view;
      this.requiresSession = options.requiresSession;
      this.app = options.app;
      this.router = new ModuleRouter({
        module: this,
        session: this.app.session
      });
      this.callStack = [];
      this.active = false;
      this.viewActivated = false;
    },
    getView: function() {
      return this.view;
    },
    getName: function() {
      return this.name;
    },
    isActive: function() {
      return this.active;
    },
    onActivated: function() {
      this.active = true;
    },
    onDeactivated: function() {
      this.active = false;
      this.viewActivated = false;
    },
    isViewActivated: function() {
      return this.viewActivated;
    },
    onRoute: function() {
      this.callStack.unshift(arguments);
      if (this.resolvingView) {
        return;
      }
      this.triggerMethod("activated", this);
      this.resolvingView = true;
      this.resolveView().fail(this.clearRoutingCallStack.bind(this)).always(function() {
        this.resolvingView = false;
        if (this.isActive()) {
          if (this.isViewActivated()) {
            if (!this.app.activateModule(this)) {
              this.onViewActivationFailed();
            } else {
              this.onViewActivated();
            }
          } else {
            this.listenToOnce(this.view, "activated", this.onViewActivated);
            if (!this.app.activateModule(this)) {
              this.onViewActivationFailed();
            }
          }
        } else {
          this.onViewActivationFailed();
        }
      }.bind(this));
    },
    resolveView: function() {
      var dfd = this.viewPromise || $.Deferred(), module = this;
      this.viewPromise = dfd;
      if (dfd.state() === "pending") {
        var _createErrorView = function(dfd) {
          module.view = new ModuleErrorView(module.viewOptions);
          dfd.reject(module.view);
        }, _resolveView = function(dfd) {
          if (module.view instanceof Marionette.View) {
            dfd.resolve(module.view);
          } else if (_.isFunction(module.view)) {
            try {
              module.view = module.view.call(module, module.viewOptions);
              _resolveView(dfd);
            } catch (e) {
              console.error(e);
              console.warn("View resolution error for module " + module.name);
              _createErrorView(dfd);
            }
          } else if (_.isString(module.view)) {
            require([ module.view ], function(View) {
              if (_.isFunction(View)) {
                try {
                  module.view = new View(module.viewOptions);
                  _resolveView(dfd);
                } catch (e) {
                  console.error(e);
                  console.warn("View construction error for module " + module.name);
                  _createErrorView(dfd);
                }
              } else {
                console.warn("Dynamic view loading resolved to an object for module " + module.name);
                _createErrorView(dfd);
              }
            }, function(err) {
              console.error(err);
              console.warn("View load error for module " + module.name);
              _createErrorView(dfd);
            });
          } else {
            console.warn("View not defined for module " + module.name);
            _createErrorView(dfd);
          }
        };
        _resolveView(dfd);
      }
      return dfd.promise();
    },
    onViewActivated: function() {
      if (this.view) {
        this.viewActivated = true;
        if (!_.isEmpty(this.callStack)) {
          var args;
          while ((args = this.callStack.pop()) != null) {
            if (args.length) {
              var name = args[0], isDefaultRoutePattern = _.any(DEFAULT_ROUTE_PATTERNS, function(rPat) {
                return rPat === name;
              });
              var callbackName = this.routes[name];
              var callback = callbackName && this.view[callbackName];
              if (_.isFunction(callback)) {
                try {
                  args = _.rest(args, 1);
                  if (isDefaultRoutePattern) {
                    var qParams = parseParam(args[args.length - 2]), pParams = args.length > 2 && args[0] ? args[0].split("/") : undefined;
                    callback.call(this.view, qParams, pParams);
                  } else {
                    callback.apply(this.view, args);
                  }
                } catch (e) {
                  console.warn("Error invoking " + callbackName + " on " + this.view.constructor.name);
                }
              }
            }
          }
        }
      }
    },
    clearRoutingCallStack: function() {
      this.callStack.splice(0, this.callStack.length);
    },
    onViewActivationFailed: function() {
      this.clearRoutingCallStack();
      this.view && this.stopListening(this.view, "activated");
    },
    destroy: function() {
      this.view && _.isFunction(this.view.destroy) && this.view.destroy();
      this.off();
      this.stopListening();
    }
  });
  var modules = [ {
    name: "default",
    basePath: "",
    routes: {
      "": "defaultViewState",
      "(/)*whatever": "defaultViewState"
    },
    view: "dctmw/pages/app/impl/def.module.view",
    requiresSession: false
  }, {
    basePath: "signin",
    routes: {
      "": "defaultViewState"
    },
    view: "dctmw/pages/signin/signin.view",
    requiresSession: false
  }, {
    basePath: "signout",
    routes: {
      "": "defaultViewState"
    },
    view: "dctmw/pages/signout/signout.view",
    requiresSession: true
  } ];
  if (extraModules) {
    modules = modules.concat(_.flatten(extraModules, true));
  }
  function onModuleActivated(options, moduleActive) {
    relativeRoutingRoot = moduleActive.basePath;
    const {
      app
    } = options;
    if (app) {
      app.showLoader();
      app.vent.trigger("module:change");
    }
    _.each(modules, function(module) {
      if (module !== moduleActive) {
        module.triggerMethod("deactivated", module);
      }
    });
  }
  function onModuleRoutingHold({
    app
  }) {
    app && app.showLoader();
  }
  function onModuleRoutingRelease({
    app
  }) {
    app && app.hideLoader();
  }
  function loadModules(options) {
    options = options || {};
    modules = _.chain(modules).filter(function(module) {
      if (_.isUndefined(module.basePath) || _.isNull(module.basePath)) {
        console.warn("Module without a base path is ignored");
        return false;
      }
      if (!_.isObject(module.routes) || _.isEmpty(module.routes)) {
        console.warn("Routeless module is ignored");
        return false;
      }
      if (!_.isString(module.view) && !_.isFunction(module.view)) {
        log.warn("View less module is registered for path : {0}", module.basePath) && console.log(log.last);
        return false;
      }
      return true;
    }).map(function(module) {
      var mod = new Module(_.defaults({}, options, module), _.omit(options, "app"));
      mod.on("activated", onModuleActivated.bind(null, options)).on("routing:hold", onModuleRoutingHold.bind(null, options)).on("routing:release", onModuleRoutingRelease.bind(null, options));
      return mod;
    }).value();
  }
  var origBackboneNavigate = Backbone.Router.prototype.navigate;
  function loadAndStart(options) {
    options.app.session.on("reload", _markSessionReloading);
    loadModules(options);
    Backbone.Router.prototype.navigate = function(fragment, options) {
      clientLocation.navigate((relativeRoutingRoot + "/" + fragment).replace(/\/$/, ""), options);
      return this;
    };
    if (!(options.embedMode === true || options.mobile === true || options.appworks === true)) {
      let cancelNextPopState = false, cancelNextCheckUrl = false, oCheckUrl = Backbone.history.checkUrl, oUpdateHash = Backbone.history._updateHash;
      Backbone.history._updateHash = function(loc, fragment, replace) {
        cancelNextPopState = replace || fragment !== location.hash.replace("#", "");
        return oUpdateHash.apply(Backbone.history, arguments);
      };
      Backbone.history.checkUrl = function() {
        clientLocation.isHashChangeEventHandlingInProgress = true;
        let retVal;
        if (cancelNextCheckUrl) {
          cancelNextCheckUrl = false;
          const currentFrag = location.hash.match(/[^\?]*/)[0];
          const context = options.app.session.getContext();
          const vsHistory = context.viewStateModel.getHistory();
          let i;
          for (i = vsHistory.length - 1; i >= 0; i--) {
            if (clientLocation.modularizeFragment(vsHistory[i].fragment) === currentFrag) {
              break;
            }
          }
          if (i !== -1) {
            const hEntry = vsHistory[i];
            const hParams = clientLocation.getHashParams();
            const urlParam = hEntry.urlParam;
            Object.keys(hParams).forEach(p => {
              if (urlParam === undefined || urlParam.includes(p)) {
                hEntry.state[p] = hParams[p];
              }
            });
            context.viewStateModel.restoreHistoryEntryByIndex(i);
          } else {
            retVal = oCheckUrl.apply(Backbone.history, arguments);
          }
        } else {
          retVal = oCheckUrl.apply(Backbone.history, arguments);
        }
        clientLocation.isHashChangeEventHandlingInProgress = false;
        return retVal;
      };
      $(window).on("popstate", () => {
        if (cancelNextPopState) {
          cancelNextPopState = false;
        } else {
          cancelNextCheckUrl = true;
        }
      });
    }
    Backbone.history.start({
      root: Backbone.history.decodeFragment(location.pathname),
      pushState: false
    });
  }
  function destroyAll() {
    modules[0].app.session.off("reload", _markSessionReloading);
    _.invoke(modules, "destroy");
    Backbone.Router.prototype.navigate = origBackboneNavigate;
  }
  function _markSessionReloading() {
    _sessionReloading = true;
  }
  return {
    loadAndStart: loadAndStart,
    destroyAll: destroyAll
  };
});