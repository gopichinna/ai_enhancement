/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/marionette',
  'nuc/contexts/context',
  'nuc/utils/errors/request',
  'nuc/utils/log'
], function (module, _, $, Marionette, Context, RequestError, log) {
  'use strict';

  log = log(module.id);

  var ContextFragment = Marionette.Controller.extend({
    constructor: function ContextFragment(context) {
      this.cid = _.uniqueId('contextFragment');
      Marionette.Controller.prototype.constructor.call(this);
      this.context = context;
      this._items = [];
      this._containers = new Set();
      this.listenTo(context, 'add:factory', addFactory);
    },

    fetch: function (options) {
      if (this.fetching) {
        log.debug('Fetching {0} continues.', this.cid) && console.log(log.last);
        return this.fetching;
      }
      this.fetched = false;
      this.error = null;
      log.info('Fetching {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('request', this);
      this.context.triggerMethod('request', this, this.context);
      var promises = fetchFactories.call(this, options);
      var self = this;
      this.fetching = $.when.apply($, promises).then(
        function () {
          self.fetching = null;
          self.fetched = true;
          log.info('Fetching {0} succeeded.', self.cid) && console.log(log.last);
          self.triggerMethod('sync', self);
          self.context.triggerMethod('sync', self.context);
        },
        function (request) {
          var error = new RequestError(request);
          self.fetching = null;
          self.error = error;
          log.error('Fetching {0} failed: {1}', self.cid, error) && console.error(log.last);
          self.triggerMethod('error', error, self);
          self.context.triggerMethod('error', error, self.context);
          return $.Deferred().reject(error);
        }
      );
      return this.fetching;
    },

    clear: function () {
      log.info('Clearing {0}.', this.cid) && console.log(log.last);
      this.triggerMethod('before:clear', this);
      this._items = [];
      this._containers.clear();
      this.triggerMethod('clear', this);
    }
  });

  function addFactory(context, propertyName, factory) {
    log.debug('Collecting factory {0} from {1} to {2}.', propertyName, factory.context.cid, this.cid) &&
      console.log(log.last);
    this._items.push({ propertyName: propertyName, factory: factory });
    // Remember sub-contexts in some factories to fetch them properly later.
    var property = factory.property;
    if (property instanceof Context) {
      this._containers.add(property);
    }
  }

  function fetchFactories(options) {
    var self = this;
    return _.chain(this._items)
      .filter(function (item) {
        var factory = item.factory;
        // Temporary factories were are never fetched by context, because
        // they get removed before fetching. Fetching a fragment does not
        // remove them, but the non-fetching behavior should remain to
        // avoid unwanted fetching.
        return (
          !factory.options.temporary &&
          // If a factory with a nested context was added, let it fetch
          // its children. Do not fetch them one-by-one again.
          !self._containers.has(factory.context) &&
          // Reuse the fetchability checks from the originating context.
          factory.context.isFetchable(factory)
        );
      })
      .map(function (item) {
        var clonedOptions = options ? _.clone(options) : {};
        return item.factory.fetch(clonedOptions);
      })
      .compact()
      .value();
  }

  return ContextFragment;
});
