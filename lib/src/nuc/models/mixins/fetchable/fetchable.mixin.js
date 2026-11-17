/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/utils/errormessage'], function (
  _,
  $,
  Backbone,
  Message
) {
  'use strict';

  var FetchableMixin = {
    mixin: function (prototype) {
      var originalFetch = prototype.fetch;

      return _.extend(prototype, {
        makeFetchable: function (options) {
          this.autoreset = options && options.autoreset;
          // Workaround for change/add/reset events, which are fired before
          // the caller is informed by sync that fetch successed.
          return this.on('reset', this._beforeFetchSucceeded, this)
            .on('add', this._beforeFetchSucceeded, this)
            .on('remove', this._beforeFetchSucceeded, this)
            .on('change', this._beforeFetchSucceeded, this);
        },

        _beforeFetchSucceeded: function () {
          this._fetchingOriginal && this._fetchSucceeded();
        },

        _fetchStarted: function () {
          this.fetched = false;
          this.error = null;
        },

        _fetchSucceeded: function () {
          this._fetchingOriginal = this.fetching = false;
          this.fetched = true;
          this.error = undefined;
        },

        _fetchFailed: function (jqxhr) {
          this._fetchingOriginal = this.fetching = false;
          this.error = new Message.RequestErrorMessage(jqxhr);
        },

        fetch: function (options) {
          var fetching = this.fetching;
          if (!fetching) {
            options = _.defaults(options || {}, {
              cache: true,
              urlBase: this.urlCacheBase ? this.urlCacheBase() : undefined
            });

            this._fetchStarted();
            options = this._prepareFetch(options);
            // Ensure that the model is marked fetched before other events are
            // triggered.  If fetching is not silent, change/add/reset will be
            // triggered earlier: change/add/reset, options.*, sync, promise.
            var self = this,
              success = options.success,
              error = options.error;
            options.success = function () {
              self._fetchSucceeded();
              success && success.apply(this, arguments);
            };
            options.error = function (_model, jqxhr, _options) {
              self._fetchFailed(jqxhr);
              error && error.apply(this, arguments);
            };
            this._fetchingOriginal = true;
            fetching = originalFetch.call(this, options);
            // If the fetch or sync method are implemented synchronously,
            // model or collection changing events are fired earlier than
            // the original fetch call returns the promise
            if (this._fetchingOriginal) {
              this.fetching = fetching;
            }
          }
          return fetching;
        },

        _prepareFetch: function (options) {
          // Trigger just one item adding operation after fetching if wanted.
          options || (options = {});
          options.reset === undefined && this.autoreset && (options.reset = true);
          return options;
        },

        ensureFetched: function (options) {
          if (this.fetched) {
            if (options && options.success) {
              options.success(this);
            }
            return $.Deferred().resolve(this, {}, options).promise();
          }
          return this.fetch(options);
        },

        invalidateFetch: function () {
          if (!this.fetching) {
            this.fetched = false;
            this.error = null;
            return true;
          }
        },

        markFetched: function () {
          if (!this.fetching) {
            this.fetched = true;
            this.error = null;
            return true;
          }
        },

        prefetch: function (response, options) {
          var deferred = $.Deferred();
          options = _.defaults(options, { parse: true });
          options = this._prepareFetch(options);
          var silent = options.silent;
          this.error = null;
          this.fetched = false;
          this.fetching = deferred.promise();
          if (!silent) {
            this.trigger('request', this, response, options);
          }
          setTimeout(
            function () {
              this._fetchSucceeded();
              if (this instanceof Backbone.Model) {
                var attributes = options.parse ? this.parse(response, options) : response;
                this.set(attributes, options);
              } else {
                var method = options.reset ? 'reset' : 'set';
                this[method](response, options);
              }
              if (options.success) {
                options.success.call(options.context, this, response, options);
              }
              if (!silent) {
                this.trigger('sync', this, response, options);
              }
              deferred.resolve();
            }.bind(this)
          );
          return this.fetching;
        }
      });
    }
  };

  return FetchableMixin;
});
