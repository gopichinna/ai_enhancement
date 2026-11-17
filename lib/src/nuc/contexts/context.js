/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/backbone',
  'nuc/lib/marionette',
  'nuc/utils/errors/request',
  'nuc/utils/log'
], function (module, _, $, Backbone, Marionette, RequestError, log) {
  'use strict';

  log = log(module.id);

  var Context = Marionette.Controller.extend({
    constructor: function Context(_options) {
      this.cid = _.uniqueId('context');
      Marionette.Controller.prototype.constructor.apply(this, arguments);
      this._factories = {};
      // Prevent pre-set attributes to take part in unique object prefixes;
      // global options passed to all factories are only for initializing
      _.each(this.options.factories, function (object) {
        object.internal = true;
      });
    },

    // Offer an intuitive interface; when a model is needed, use getModel, when a collection
    // is needed, use getCollection, and when other object is needed, use getObject
    getModel: getObject, // NodeModel, e.g.
    getCollection: getObject, // FavoriteCollection, e.g.
    getObject: getObject, // Connector, e.g.

    // Offer an intuitive interface; when a model is needed, use hasModel, when a collection
    // is needed, use hasCollection, and when other object is needed, use hasObject
    hasModel: hasObject, // NodeModel, e.g.
    hasCollection: hasObject, // FavoriteCollection, e.g.
    hasObject: hasObject, // Connector, e.g.

    getFactory: function (Factory, options) {
      return this._getFactory(Factory, options, true);
    },

    clear: function (options) {
      log.info('Clearing {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('before:clear', this);
      if (options && options.all) {
        this._destroyAllFactories();
      } else {
        this._destroyNonPermanentFactories();
      }
      // The context will be reused to fetch new data. Even if the old data were
      // still being fetched, it would be a background operation without display,
      // which does not have to block the new data to keep the pag consistent.
      this.suppressFetch();
      log.info('Clearing {0} succeeded.', this.cid) && console.log(log.last);
      this.triggerMethod('clear', this);
      return this;
    },

    // TODO: Deprecate this in favour of the fetchability (fetching, fetched, error)
    isBusy: function () {
      return this.fetching;
    },

    fetch: function (options) {
      options || (options = {});

      if (this.fetching) {
        log.debug('Fetching {0} continues.', this.cid) && console.log(log.last);
        return this.fetching;
      }
      this.fetched = false;
      this.error = null;
      log.info('Fetching {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('request', this);

      this._destroyTemporaryFactories();
      var self = this;
      var fetchableFactories = _.filter(this._factories, function (factory) {
        return self.isFetchable(factory);
      });
      var factoryPromises = _.chain(fetchableFactories)
        .map(function (factory) {
          var clonedOptions = options ? _.clone(options) : {};

          if (self._synchronizeFetches) {
            // let the factory use a clone of the model/collection for fetching to prevent views
            // that subscribed for events will immediately render
            return factory.cloneAndFetch(clonedOptions).then(function () {
              log.debug('Results of ' + factory.property.constructor.name + ' arrived.') && console.log(log.last);
            });
          } else {
            // caller of fetch explicitly wants not to synchronize (views render immediately
            // when fetched data is received and model updated)
            return factory.fetch(clonedOptions);
          }
        })
        .compact()
        .value();

      if (log.can('DEBUG')) {
        _.each(fetchableFactories, function (factory) {
          log.debug('Waiting for fetch results of ' + factory.property.constructor.name) && console.log(log.last);
        });
      }

      var finalDeferred = $.Deferred();
      var finalPromise = (this.fetching = finalDeferred.promise());

      $.when.apply($, factoryPromises).then(
        function () {
          if (self.fetching === finalPromise) {
            self.fetching = null;
            self.fetched = true;
            log.info('Fetching {0} succeeded.', self.cid) && console.log(log.last);

            if (self._synchronizeFetches) {
              self.triggerMethod('before:models:reset', self);
              _.each(fetchableFactories, function (factory) {
                factory.copyFetchedResultsToOriginalProperty();
              });
            }
            self.triggerMethod('sync', self);
            finalDeferred.resolve();
          } else {
            log.debug('Suppressed fetching {0} succeeded.', self.cid) && console.log(log.last);
          }
        },
        function (request) {
          var error = new RequestError(request);
          if (self.fetching === finalPromise) {
            self.fetching = null;
            self.error = error;
            log.error('Fetching {0} failed: {1}', self.cid, error) && console.error(log.last);
            self.triggerMethod('error', error, self);
            finalDeferred.reject(error);
          } else {
            log.debug('Suppressed fetching {0} failed: {1}.', self.cid, error.message) && console.log(log.last);
          }
        }
      );
      return finalPromise;
    },

    isFetchable: function (factory) {
      return this._isFetchable(factory);
    },

    _isFetchable: function (factory) {
      if (factory.options.detached) {
        return false;
      }
      if (factory.isFetchable) {
        return factory.isFetchable();
      }
      return !!factory.fetch;
    },

    suppressFetch: function () {
      if (this.fetching) {
        log.debug('Suppressing the fetch in progress in {0}.', this.cid) && console.log(log.last);
        this.fetching = null;
        this.fetched = false;
        this.error = null;
        // Events "request" and "sync/error" must be balanced in pair.
        this.triggerMethod('sync', this);
        return true;
      }
    },

    _destroyTemporaryFactories: function () {
      this._factories = _.pick(
        this._factories,
        function (factory, propertyName) {
          if (factory.options.temporary) {
            this._removeFactory(propertyName);
          } else {
            return true;
          }
        },
        this
      );
    },

    _destroyNonPermanentFactories: function () {
      this._factories = _.pick(
        this._factories,
        function (factory, propertyName) {
          if (factory.options && factory.options.permanent) {
            return true;
          } else {
            this._removeFactory(propertyName);
          }
        },
        this
      );
    },

    _destroyAllFactories: function () {
      _.each(
        this._factories,
        function (factory, propertyName) {
          this._removeFactory(propertyName);
        },
        this
      );
      this._factories = {};
    },

    _getPropertyName: function (Factory, options) {
      options || (options = {});
      // Pre-initializing the model with its type or id will make it unique in the context
      var attributes = options.attributes || {};

      // Stamp globally unique factory names by an artificial attribute
      if (options.unique) {
        attributes = _.extend(
          {
            stamp: _.uniqueId()
          },
          attributes
        );
      }
      return _.reduce(
        attributes,
        function (result, value, key) {
          if (value == null) {
            return result;
          }
          if (result !== null) {
            return result + '-' + key + '-' + value;
          }
          return key + '-' + value;
        },
        Factory.prototype.propertyPrefix
      );
    },

    _getFactory: function (Factory, options, createIfNotFound) {
      // Support getting objects by the factory name, if the factory object
      // cannot be required as a dependency
      if (typeof Factory === 'string') {
        return this._factories[Factory];
      }
      options || (options = {});
      // Factories expect their options in a property named with their prefix; options for all
      // factories are together to allow passing options to nested factories
      var propertyPrefix = Factory.prototype.propertyPrefix,
        globalOptions = this.options.factories || {},
        objectOptions,
        nameOptions,
        factoryOptions;
      // Calls outside the factories can pass options.  Further calls to nested factories include
      // options from the context constructor already; do not extend the options in that case.
      if (options.internal) {
        objectOptions = options[propertyPrefix];
        // It is not possible to use the pre-initializing of the factory
        // properties for nested factories.  It works only on the first
        // level - for the caller outside the context constructor.
        if (objectOptions && !objectOptions.internal && !(objectOptions instanceof Backbone.Model)) {
          // Limit the parameters to the only object useful for the _getPropertyName
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      } else {
        // The caller outside the factories does not need to wrap the options in the factory
        // prefix key; we do it here for their convenience
        objectOptions = options[propertyPrefix];
        // If no factory options were passed in, let the context ctor options merge in
        if (objectOptions === undefined && !_.isEmpty(options)) {
          // Merge this factory options from context constructor with getObject arguments
          factoryOptions = _.omit(options, 'detached', 'permanent', 'temporary', 'unique');
          if (!_.isEmpty(factoryOptions)) {
            options[propertyPrefix] = _.defaults(factoryOptions, globalOptions[propertyPrefix]);
          }
        }
        _.defaults(
          options,
          {
            internal: true
          },
          globalOptions
        );
        // Prefer the attributes passed to the getObject method directly
        // to the attributes passed via the factory-specific options.
        // If the factory-specific options are a Backbone model, it is
        // the scenario pre-initializing the factory properties and the
        // explicit attributes are mandatory then.
        nameOptions = {
          attributes: options.attributes,
          unique: options.unique
        };
        if (
          !nameOptions.attributes &&
          objectOptions &&
          !objectOptions.internal &&
          !(objectOptions instanceof Backbone.Model)
        ) {
          // Limit the parameters to the only object useful for the _getPropertyName
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      }
      // The property name for the factory is computed just from its options
      var propertyName = this._getPropertyName(Factory, nameOptions);
      var factory = this._factories[propertyName];
      if (!factory && createIfNotFound) {
        options.factoryName = propertyName;
        factory = new Factory(this, options);
        this._factories[propertyName] = factory;
        log.debug('Adding factory {0} to {2}.', propertyName, factory.context.cid, this.cid) && console.log(log.last);
        this.triggerMethod('add:factory', this, propertyName, factory);
        // Re-trigger events from sub-contexts in some factories.
        var property = factory.property;
        if (property instanceof Context) {
          this.listenTo(property, 'add:factory', function (context, propertyName, factory) {
            this.triggerMethod('add:factory', this, propertyName, factory);
          }).listenTo(property, 'remove:factory', function (context, propertyName, factory) {
            this.triggerMethod('remove:factory', this, propertyName, factory);
          });
        }
      }
      return factory;
    },

    _removeFactory: function (propertyName) {
      var factory = this._factories[propertyName];
      // Stop listening to sub-context events from removed factories.
      var property = factory.property;
      if (property instanceof Context) {
        this.stopListening(property, 'add:factory').stopListening(property, 'remove:factory');
      }
      this.triggerMethod('remove:factory', this, propertyName, factory);
      factory.destroy();
    },

    onDestroy: function () {
      this.clear({ all: true });
    }
  });

  function getObject(Factory, options) {
    var factory = this._getFactory(Factory, options, true);
    return factory.property;
  }

  function hasObject(Factory, options) {
    return !!this._getFactory(Factory, options, false);
  }

  return Context;
});
