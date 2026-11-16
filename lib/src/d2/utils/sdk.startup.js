/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/log", "d2/sdk/models/module.collection", "dctmw/utils/utils", "d2/utils/sdk.ext.loader" ], function(module, require, _, $, log, ServerModuleCollection, utils) {
  "use strict";
  var logger = log(module.id);
  var pluginModuleModels = new ServerModuleCollection().getPluginModules();
  function createChainedExecutor(relativeModulePath, functionName) {
    if (!relativeModulePath.startsWith("/")) {
      relativeModulePath = "/" + relativeModulePath;
    }
    return function() {
      var context = this, args = arguments, modulePaths = pluginModuleModels.map(function(model) {
        return model.get("id") + relativeModulePath;
      });
      return _.reduce(modulePaths, function(promise, moduleId) {
        var dfd = $.Deferred();
        promise.always(function() {
          logger.debug("Loading : " + moduleId) && console.log(logger.last);
          require([ moduleId ], function(module) {
            logger.debug("Loaded : " + moduleId) && console.log(logger.last);
            if (module && _.isFunction(module[functionName])) {
              var retVal = module[functionName].apply(context, args);
              if (utils.isJqueryPromise(retVal)) {
                logger.debug("Async " + functionName + "() in module " + moduleId) && console.log(logger.last);
                retVal.done(dfd.resolve).fail(dfd.reject);
              } else {
                logger.debug("Sync " + functionName + "() in module " + moduleId) && console.log(logger.last);
                dfd.resolve(retVal);
              }
            } else {
              logger.warn("No " + functionName + "() in module " + moduleId) && console.log(logger.last);
              dfd.resolve();
            }
          }, function(e) {
            logger.warn("Failed to load : " + moduleId) && console.log(logger.last);
            dfd.reject(e);
          });
        });
        return dfd.promise();
      }, $.Deferred().resolve().promise());
    };
  }
  return {
    beforeStartup: createChainedExecutor("utils/startup", "beforeStartup"),
    afterStartup: createChainedExecutor("utils/startup", "afterStartup")
  };
});