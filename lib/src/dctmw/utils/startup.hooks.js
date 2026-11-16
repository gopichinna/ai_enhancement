/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/log", "dctmw/models/module.collection", "dctmw/utils/utils" ], function(module, require, _, $, log, ServerModuleCollection, utils) {
  "use strict";
  const logger = log(module.id);
  const pluginModuleModels = new ServerModuleCollection().getPluginModules();
  function createChainedExecutor(relativeModulePath, functionName) {
    if (!relativeModulePath.startsWith("/")) {
      relativeModulePath = "/" + relativeModulePath;
    }
    return function() {
      const args = arguments, modulePaths = pluginModuleModels.map(function(model) {
        return model.get("id") + relativeModulePath;
      });
      return _.reduce(modulePaths, function(promise, moduleId) {
        const dfd = $.Deferred();
        promise.done(function() {
          const prevArgs = Array.prototype.slice.call(arguments);
          logger.debug(`Loading : ${moduleId}`) && console.log(logger.last);
          require([ moduleId ], function(module) {
            logger.debug(`Loaded : ${moduleId}`) && console.log(logger.last);
            if (module && _.isFunction(module[functionName])) {
              const retVal = module[functionName].apply(module, args);
              if (utils.isJqueryPromise(retVal)) {
                logger.debug(`Async '${functionName}()' in module ${moduleId}`) && console.log(logger.last);
                retVal.done(function() {
                  const localArgs = Array.prototype.slice.call(arguments);
                  dfd.resolve.apply(dfd, [ ...prevArgs, ...localArgs ]);
                }).fail(e => {
                  logger.error(`Error "${e instanceof Error ? e.message : e}" in executing '${functionName}()' of module ${moduleId}`) && console.error(logger.last);
                  dfd.reject.apply(dfd, [ ...prevArgs, e ]);
                });
              } else {
                logger.debug(`Sync '${functionName}()' in module ${moduleId}`) && console.log(logger.last);
                dfd.resolve.apply(dfd, [ ...prevArgs, retVal ]);
              }
            } else {
              logger.warn(`No '${functionName}()' in module ${moduleId}`) && console.warn(logger.last);
              dfd.resolve.apply(dfd, prevArgs);
            }
          }, function(e) {
            logger.warn(`Failed to load : ${moduleId} due to ${e.message}`) && console.warn(logger.last);
            if (e.requireType === "scripterror" && e.requireModules[0] === moduleId) {
              logger.warn(`Continuing '${functionName}()' despite of module load error`) && console.warn(logger.last);
              dfd.resolve.apply(dfd, prevArgs);
            } else {
              logger.error(`Halting '${functionName}()' due to module load error`) && console.error(logger.last);
              dfd.reject.apply(dfd, [ ...prevArgs, e ]);
            }
          });
        }).fail(dfd.reject);
        return dfd.promise();
      }, $.Deferred().resolve().promise());
    };
  }
  return {
    beforeStartup: createChainedExecutor("utils/startup", "beforeStartup"),
    afterStartup: createChainedExecutor("utils/startup", "afterStartup")
  };
});