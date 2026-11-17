/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require" ], function(require) {
  "use strict";
  function requirePromise(moduleName) {
    return new Promise(function(resolve, reject) {
      require([ moduleName ], function(module) {
        resolve(module);
      }, function(error) {
        reject(error);
      });
    });
  }
  return {
    requirePromise: requirePromise
  };
});