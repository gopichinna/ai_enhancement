/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/jquery'], function (_, $) {
  'use strict';

  var SyncableFromMultipleSources = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeSyncableFromMultipleSources: function (_options) {
          return this;
        },

        syncFromMultipleSources: function (promises, mergeSources, convertError, options) {
          // Convert $.ajax rejected value by default
          function convertAjaxError(result) {
            return Array.isArray(result) ? result[0] : result;
          }

          // The convertError parameter is optional
          if (options === undefined && typeof convertError === 'object') {
            options = convertError;
            convertError = convertAjaxError;
          } else if (convertError == null) {
            convertError = convertAjaxError;
          }

          var model = this,
            // Pick only jQuery objects, which support the abort() method,
            // from all promises.
            abortables = promises.filter(function (promise) {
              return promise.abort;
            }),
            deferred = $.Deferred(),
            promise = deferred.promise();
          // Propagate jQuery object aborting interface, if the promises
          // come from $.ajax calls; add inject the abort() method.
          if (abortables.length) {
            promise.abort = function (statusText) {
              statusText || (statusText = 'canceled');
              abortables.forEach(function (promise) {
                promise.abort(statusText);
              });
              return this;
            };
          }
          // Implement Backbone event flow - 'request', callback,
          // promise. (Populating the model and triggering 'sync' or
          // 'error' events takes place in the fetch method.)
          model.trigger('request', model, {}, options);
          $.when
            .apply($, promises)
            .done(function () {
              var response = mergeSources.apply(model, arguments),
                success = options.success;
              if (success) {
                success.call(options.context, response, 'success', {});
              }
              deferred.resolve(response, 'success', {});
            })
            .fail(function () {
              var object = convertError.apply(model, arguments),
                error = options.error;
              if (error) {
                error.call(options.context, object, 'error', object.statusText);
              }
              // Return only the first error for simplicity; the others
              // will be logged by the connector, if they come from
              // failing $.ajax calls.
              deferred.reject.call(deferred, object, 'error', object.statusText);
            });
          return promise;
        }
      });
    }
  };

  return SyncableFromMultipleSources;
});
