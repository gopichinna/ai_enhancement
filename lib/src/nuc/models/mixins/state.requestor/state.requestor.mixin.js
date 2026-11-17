/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  var StateRequestorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeStateRequestor: function (options) {
          this.stateEnabled = options && options.stateEnabled;
          return this;
        },

        enableState: function () {
          this.stateEnabled = true;
        },

        disableState: function () {
          this.stateEnabled = false;
        },

        getStateEnablingUrlQuery: function () {
          var stateEnabled =
            this.stateEnabled != null ? this.stateEnabled : this.collection && this.collection.stateEnabled;
          return stateEnabled ? { state: '' } : {};
        }
      });
    }
  };

  return StateRequestorMixin;
});
