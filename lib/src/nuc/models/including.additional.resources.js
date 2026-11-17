/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function IncludingAdditionalResources(_ParentModel) {
    var prototype = {
      makeIncludingAdditionalResources: function (options) {
        // log.warn('Module "nuc/models/including.additional.resources" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/including.additional.resources/including.additional.resources.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        this._additionalResources = [];
        if (options && options.includeResources) {
          this.includeResources(options.includeResources);
        }
        return this;
      },

      includeResources: function (names) {
        if (!_.isArray(names)) {
          names = names.split(',');
        }
        this._additionalResources = _.union(this._additionalResources, names);
      },

      excludeResources: function (names) {
        if (names) {
          if (!_.isArray(names)) {
            names = names.split(',');
          }
          this._additionalResources = _.reject(this._additionalResources, names);
        } else {
          this._additionalResources = [];
        }
      },

      getAdditionalResourcesUrlQuery: function () {
        return _.reduce(
          this._additionalResources,
          function (result, parameter) {
            result[parameter] = 'true';
            return result;
          },
          {}
        );
      }
    };
    prototype.IncludingAdditionalResources = _.clone(prototype);

    return prototype;
  }

  return IncludingAdditionalResources;
});
