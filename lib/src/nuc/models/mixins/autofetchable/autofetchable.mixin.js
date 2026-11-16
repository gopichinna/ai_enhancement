/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  var AutoFetchableMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeAutoFetchable: function (options) {
          var autofetchEvent = options && options.autofetchEvent;
          if (autofetchEvent) {
            this._autofetchEvent = options.autofetchEvent;
          }
          var autofetch = options && options.autofetch;
          if (autofetch) {
            this.automateFetch(autofetch);
          }
          return this;
        },

        automateFetch: function (enable) {
          var event = _.result(this, '_autofetchEvent'),
            method = enable ? 'on' : 'off';
          this.autofetch = !!enable;
          this[method](event, _.bind(this._fetchAutomatically, this, enable));
        },

        isFetchable: function () {
          return !!this.get('id');
        },

        _autofetchEvent: 'change:id',

        _fetchAutomatically: function (options) {
          this.isFetchable() && this.fetch(_.isObject(options) && options);
        }
      });
    }
  };

  return AutoFetchableMixin;
});
