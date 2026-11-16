/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

var _ = require("lodash");

_.mixin(require("underscore.string").exports());

_.mixin({
  dottify: function(str) {
    return _.trim(str).replace(/([A-Z])/g, ".$1").replace(/[-_-\s]+/g, ".").toLowerCase();
  },
  computerize: function(str) {
    return _.trim(str).replace(/[ ._-]/g, "").toLowerCase();
  }
});

module.exports = _;