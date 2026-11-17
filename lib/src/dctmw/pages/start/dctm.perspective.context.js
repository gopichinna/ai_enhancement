/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/contexts/factories/connector", "csui/utils/contexts/perspective/perspective.context", "dctmw/pages/app/application.context" ], function(_, ConnectorFactory, PerspectiveContext, ApplicationContext) {
  "use strict";
  var DctmPerspectiveContext = PerspectiveContext.extend({
    constructor: function DctmPerspectiveContext(options) {
      options = options || {};
      this.parentContext = options.context || new ApplicationContext(options);
      this.parentContext.on("all", this._proxyEvents.bind(this));
      PerspectiveContext.prototype.constructor.apply(this, arguments);
      this._copyFactories();
      const connector = this.getObject(ConnectorFactory);
      connector.context = this;
      this._enableParentContextFnDelegation();
    },
    initialize: function() {
      this.viewStateModel = this.parentContext.viewStateModel;
    },
    _proxyEvents: function() {
      var pc = this.parentContext, self = this, nArguments = _.map(arguments, function(arg) {
        return arg === pc ? self : arg;
      });
      self.triggerMethod.apply(self, nArguments);
    },
    _copyFactories: function() {
      this._factories = this.parentContext._factories;
    },
    _getFactory: function(Factory, options, createIfNotFound) {
      return this.parentContext._getFactory(Factory, options, createIfNotFound);
    },
    _isFetchable: function(factory) {
      return this.parentContext._isFetchable(factory);
    },
    _destroyTemporaryFactories: function() {
      var retVal = this.parentContext._destroyTemporaryFactories();
      this._copyFactories();
      return retVal;
    },
    _destroyNonPermanentFactories: function() {
      var retVal = this.parentContext._destroyNonPermanentFactories();
      this._copyFactories();
      return retVal;
    },
    _destroyAllFactories: function() {
      var retVal = this.parentContext._destroyAllFactories();
      this._copyFactories();
      return retVal;
    },
    clear: function(options) {
      this.parentContext.clear(options);
      this._copyFactories();
      _.invoke(this._plugins, "onClear");
      return this;
    },
    isBusy: function() {
      return this.parentContext.isBusy();
    },
    fetch: function(options) {
      var retVal = this.parentContext.fetch(options);
      retVal.always(this._copyFactories.bind(this));
      return retVal;
    },
    suppressFetch: function() {
      return this.parentContext.suppressFetch();
    },
    onDestroy: function() {
      return this.parentContext.onDestroy();
    },
    reset: function() {
      this._applicationScope && this._applicationScope.clear({
        silent: true
      });
      this._forcePerspectiveChange = true;
      this.clear();
      this.trigger("reset", this);
    },
    applyPerspective: function(sourceModel, forceChange, perspective) {
      forceChange = forceChange || this._forcePerspectiveChange;
      this._forcePerspectiveChange = false;
      return PerspectiveContext.prototype.applyPerspective.call(this, sourceModel, forceChange, perspective);
    },
    _enableParentContextFnDelegation: function() {
      this.parentContext.isFetchableDelegate = function(factory) {
        return PerspectiveContext.prototype._isFetchable.call(this, factory);
      }.bind(this);
    }
  });
  return DctmPerspectiveContext;
});