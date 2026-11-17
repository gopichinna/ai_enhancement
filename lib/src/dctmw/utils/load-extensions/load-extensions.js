/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui-ext", "nuc/lib/underscore", "nuc/utils/deepClone/deepClone" ], function(NucExtLoader, _) {
  "use strict";
  function isNonEmptyString(str) {
    return _.isString(str) && !_.isEmpty(str);
  }
  function getNSPrefix(moduleName) {
    if (isNonEmptyString(moduleName)) {
      var idxSlash = moduleName.indexOf("/");
      if (idxSlash > 0) {
        return moduleName.substring(0, idxSlash);
      }
    }
  }
  return {
    load: function(name, require, onLoad, runtimeConfig) {
      var indexToNSMap = {};
      var cbOnLoad = function() {
        _.each(arguments[0], function(arg, i) {
          if (isNonEmptyString(indexToNSMap[i]?.ns)) {
            arg._srcNS = indexToNSMap[i].ns;
            arg._srcModule = indexToNSMap[i].moduleId;
          }
        });
        onLoad(arguments[0]);
      }, cbRequire = function(deps, cbSuccess, cbError) {
        _.each(deps, function(dep, i) {
          indexToNSMap[i] = {
            ns: getNSPrefix(dep),
            moduleId: dep
          };
        });
        require(deps, cbSuccess, cbError);
      };
      cbRequire.moduleConfig = require.moduleConfig;
      NucExtLoader.load(name, cbRequire, cbOnLoad, runtimeConfig);
    }
  };
});