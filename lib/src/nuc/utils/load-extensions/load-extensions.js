/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore'], function (module, _) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    ignoreRequireErrors: false,
    // Modules in CS core (LES_MODULES) are tested together for every
    // quarterly update; they should be always compatible
    modulePrefixesToRetry: ['nuc', 'csui', 'classifications', 'esoc', 'wiki', 'workflow', 'webreports']
  });

  function handleSuccess(onLoad, parameters) {
    onLoad(Array.prototype.slice.call(parameters));
  }

  function handleError(error, onLoad) {
    if (config.ignoreRequireErrors) {
      console.error(error);
      console.warn('Loading extensions of "' + name + '" failed:', error.requireModules);
      onLoad([]);
    } else {
      onLoad.error(error);
    }
  }

  function retryLoading(require, name, modules, onLoad, firstError) {
    var droppedModules = [],
      selectedModules = _.filter(modules, function (module) {
        var slash = module.indexOf('/');
        if (slash < 0 || _.contains(config.modulePrefixesToRetry, module.substring(0, slash))) {
          return true;
        } else {
          droppedModules.push(module);
        }
      });
    if (selectedModules.length && droppedModules.length) {
      console.error(firstError);
      console.warn('Loading extensions of "' + name + '" failed:', firstError.requireModules);
      console.warn('Dropping extensions:', droppedModules);
      console.warn('Retrying extensions:', selectedModules);
      require(selectedModules, function () {
        handleSuccess(onLoad, arguments);
      }, function (error) {
        handleError(error, onLoad);
      });
      return true;
    }
  }

  return {
    load: function (name, require, onLoad, runtimeConfig) {
      if (runtimeConfig.isBuild) {
        onLoad();
      } else {
        var moduleConfig = require.moduleConfig(name),
          modules = moduleConfig.extensions;
        if (modules) {
          // Support either array of module names or a map with keys pointing
          // to arrays of module names; the latter can be used for decentralized
          // configuration (multiple calls to require.config, which can merge
          // maps only; not arrays)
          if (!_.isArray(modules)) {
            modules = Array.prototype.concat.apply([], _.values(modules));
          }
          if (modules.length) {
            require(modules, function () {
              handleSuccess(onLoad, arguments);
            }, function (error) {
              if (!retryLoading(require, name, modules, onLoad, error)) {
                handleError(error, onLoad);
              }
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
