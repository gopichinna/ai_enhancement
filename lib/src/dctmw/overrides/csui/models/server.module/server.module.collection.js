/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/server.module/server.module.collection" ], function(require, _, $, CSUIServerModuleCollection) {
  "use strict";
  const origInitialize = CSUIServerModuleCollection.prototype.initialize;
  const dctmModules = _.map(require.moduleConfig("dctmw/models/module.collection").modules || [], (attr, id) => {
    attr.id = id;
    return attr;
  });
  CSUIServerModuleCollection.prototype.initialize = function initialize(models, options) {
    this.options = this.options || options;
    const retVal = origInitialize && origInitialize.call(this, models, options);
    const {
      ownModulesOnly
    } = this.options;
    if (ownModulesOnly !== true) {
      if (_.isArray(models)) {
        dctmModules.forEach(dModule => {
          if (!models.find(cModule => cModule.id === dModule.id)) {
            models.push(dModule);
          }
        });
      } else {
        dctmModules.length && this.add(dctmModules, {
          silent: true
        });
      }
    }
    return retVal;
  };
  CSUIServerModuleCollection.prototype._resolveServerModules = function() {
    return $.Deferred().resolve().promise();
  };
});