/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  function ObjectStorage() {
    this.items = {};
  }

  _.extend(ObjectStorage.prototype, {
    constructor: ObjectStorage,
    setItem: function (k, v) {
      this.items[k] = v;
    },

    getItem: function (k) {
      return this.items[k];
    },

    removeItem: function (k) {
      delete this.items[k];
    }
  });

  return ObjectStorage;
});
