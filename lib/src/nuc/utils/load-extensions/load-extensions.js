/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function () {
  'use strict';

  return {
    load(name, require, onLoad, runtimeConfig) {
      if (runtimeConfig.isBuild) {
        onLoad();
      } else {
        const moduleConfig = require.moduleConfig(name);
        let modules = moduleConfig.extensions;
        if (modules) {
          // Support either array of module names or a map with keys pointing
          // to arrays of module names; the latter can be used for decentralized
          // configuration (multiple calls to require.config, which can merge
          // maps only; not arrays)
          if (!Array.isArray(modules)) {
            modules = Object.values(modules).flat();
          }
          if (modules.length) {
            require(modules, function (...args) {
              onLoad(args);
            }, function (error) {
              onLoad.error(error);
            });
          } else {
            onLoad([]);
          }
        } else {
          onLoad();
        }
      }
    }
  };
});
