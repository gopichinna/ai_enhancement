/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/log'], function (module, _, $, log) {
  'use strict';

  log = log(module.id);

  function FetchableModel(ParentModel) {
    var prototype = {
      makeFetchable: function (options) {
        // log.warn('Module "nuc/models/fetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/fetchable/fetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        this.autoreset = options && options.autoreset;
        // Workaround for change/add/reset events, which are fired before
        // the caller is informed by sync that fetch successed.
        return this.on('reset', this._beforeFetchSucceeded, this)
          .on('add', this._beforeFetchSucceeded, this)
          .on('change', this._beforeFetchSucceeded, this);
      },

      _beforeFetchSucceeded: function () {
        this.fetching && this._fetchSucceeded();
      },

      _fetchSucceeded: function () {
        this.fetching = false;
        this.fetched = true;
      },

      _fetchFailed: function () {
        this.fetching = false;
      },

      fetch: function (options) {
        if (!this.fetching) {
          this.fetched = false;
          log.debug('Fetching is starting for {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
          options = this._prepareFetch(options);
          // Ensure that the model is marked fetched before other events are
          // triggered.  If fetching is not silent, change/add/reset will be
          // triggered earlier: change/add/reset, options.*, sync, promise.
          var self = this,
            success = options.success,
            error = options.error;
          options.success = function () {
            log.debug('Fetching succeeded for {0} ({1}).', log.getObjectName(self), self.cid) && console.log(log.last);
            self._fetchSucceeded();
            success && success.apply(this, arguments);
          };
          options.error = function () {
            log.debug('Fetching failed for {0} ({1}).', log.getObjectName(self), self.cid) && console.log(log.last);
            self._fetchFailed();
            error && error.apply(this, arguments);
          };
          this.fetching = ParentModel.prototype.fetch.call(this, options);
        } else {
          log.debug('Fetching is in progress for {0} ({1}).', log.getObjectName(this), this.cid) &&
            console.log(log.last);
        }
        return this.fetching;
      },

      _prepareFetch: function (options) {
        // Trigger just one item adding operation after fetching if wanted.
        options || (options = {});
        options.reset === undefined && this.autoreset && (options.reset = true);
        return options;
      },

      ensureFetched: function (options) {
        if (this.fetched) {
          log.debug('No need to fetch {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
          if (options && options.success) {
            options.success(this);
          }
          return $.Deferred().resolve(this, {}, options).promise();
        }
        return this.fetch(options);
      }
    };
    prototype.Fetchable = _.clone(prototype);

    return prototype;
  }

  return FetchableModel;
});
