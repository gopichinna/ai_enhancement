/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/pages/start/multi.perspective.routing", "csui/utils/contexts/factories/application.scope.factory" ], function(module, require, $, _, MultiPerspectiveRouting, ApplicationScopeModelFactory) {
  "use strict";
  let instance, handlers = [], config = _.defaults({}, module.config(), {
    routingModulesExtensionPath: "csui/pages/start/perspective.routing"
  });
  const DctmPerspectiveRouting = MultiPerspectiveRouting.extend({
    constructor: function DctmPerspectiveRouting(options) {
      this.options = _.extend({}, options);
      this._routers = [];
      this._context = this.options.context;
      this._context.viewStateModel.set("PerspectiveRouting", this);
      this.listenTo(this._context, "reset", function() {
        this._informOthers();
      });
      this._applicationScope = this._context.getModel(ApplicationScopeModelFactory);
      this._originalHistoryLength = history.length;
      this.started = false;
    },
    start: function() {
      const dfd = $.Deferred();
      require([ `csui-ext!${config.routingModulesExtensionPath}` ], extraRouters => {
        const DefaultRouters = [];
        const Routers = _.chain(extraRouters).flatten(true).filter(function(Router) {
          if (Router.isDefault) {
            DefaultRouters.push(Router);
          } else {
            return true;
          }
        }).concat(DefaultRouters).unique().reverse().value(), routeWithSlashes = false;
        const routers = _.map(Routers, function(Router, index) {
          const perspectiveRouting = this;
          Router.prototype.route = function(route, name, callback) {
            if (!_.isRegExp(route)) {
              route = this._routeToRegExp(route);
            }
            if (_.isFunction(name)) {
              callback = name;
              name = "";
            }
            if (!callback) {
              callback = this[name];
            }
            const router = this;
            perspectiveRouting.addRoute(route, function(fragment) {
              const args = router._extractParameters(route, fragment);
              if (router.execute(callback, args, name) !== false) {
                router.trigger.apply(router, [ "route:" + name ].concat(args));
                router.trigger("route", name, args);
                perspectiveRouting.trigger("route", router, name, args);
              }
            }, Router.isDefault);
            return this;
          };
          const router = new Router(_.extend({
            routeWithSlashes: routeWithSlashes
          }, this.options));
          if (!router.name) {
            router.name = index;
          }
          router.on("before:route", _.bind(this._informOthers, this));
          return router;
        }, this);
        Array.prototype.push.apply(this._routers, routers);
        this.started = true;
        this._context && this._context.viewStateModel.set("history", true);
        dfd.resolve();
      }, dfd.reject);
      return dfd.promise();
    },
    addRoute: function(route, callback, isDefaultRouter) {
      handlers.unshift({
        route: route,
        callback: callback,
        isDefaultRouter: isDefaultRouter
      });
    },
    matchRoute: function(fragment) {
      return _.some(handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    }
  });
  DctmPerspectiveRouting.routesWithSlashes = false;
  return {
    getInstance: function(options) {
      if (!instance) {
        if (options.context && options.context.viewStateModel) {
          const inst = options.context.viewStateModel.get("PerspectiveRouting");
          if (inst) {
            return inst;
          }
        }
        instance = new DctmPerspectiveRouting(options);
      }
      return instance;
    },
    routesWithSlashes: false
  };
});