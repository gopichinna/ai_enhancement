/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore' /*, 'module', 'nuc/utils/log'*/], function (_ /*, module, log*/) {
  'use strict';

  // log = log(module.id);

  function AutoFetchableModel(_ParentModel) {
    var prototype = {
      makeAutoFetchable: function (options) {
        // log.warn('Module "nuc/models/autofetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/autofetchable/autofetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.autofetch && this.automateFetch(options.autofetch);
        return this;
      },

      automateFetch: function (enable) {
        this[enable ? 'on' : 'off'](_.result(this, '_autofetchEvent'), _.bind(this._fetchAutomatically, this, enable));
      },

      isFetchable: function () {
        return !!this.get('id');
      },

      _autofetchEvent: 'change:id',

      _fetchAutomatically: function (enableOptions, model, value, options) {
        if (this.isFetchable()) {
          var fullOptions = _.extend({}, enableOptions, options);
          this.fetch(fullOptions);
        }
      }
    };
    prototype.AutoFetchable = _.clone(prototype);

    return prototype;
  }

  return AutoFetchableModel;
});
