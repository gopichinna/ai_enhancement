/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "csui/lib/othelp", "csui/models/server.module/server.module.collection", "i18n" ], function(module, $, _, OTHHUrlBuilder, ServerModuleCollection, i18n) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    language: i18n.settings.locale.replace(/[-_]\w+$/, ""),
    preserve: true,
    type: "ofh1"
  });
  if (config.urlRoot === "") {
    config.urlRoot = undefined;
  }
  if (config.tenant === "") {
    config.tenant = undefined;
  }
  if (config.type === "") {
    config.type = undefined;
  }
  var documentationUtils = {
    getHelpUrl: function(options) {
      options = options || {};
      var def = $.Deferred(), serverModules = this.createServerModuleCollection(), moduleNamePattern = options.moduleNamePattern || "^d2", activeHelpModuleName = options.activeHelpModuleName;
      serverModules.fetch().then(function() {
        var targetModulesWithHelp;
        var urlBuilder;
        var documentsOptions;
        var helpURL;
        var moduleRegExp = new RegExp(moduleNamePattern, "");
        let activeModuleFound = false;
        targetModulesWithHelp = serverModules.filter(function(serverModule) {
          const moduleId = serverModule.get("id");
          const matches = _.isString(moduleId) && !_.isEmpty(moduleId) && moduleRegExp.test(moduleId);
          if (matches && activeHelpModuleName === moduleId && !activeModuleFound) {
            activeModuleFound = true;
          }
          return matches;
        });
        var config = this.getConfig(options);
        documentsOptions = {
          preserve: config.preserve,
          documents: []
        };
        _.each(targetModulesWithHelp, function(serverModule, index) {
          const currmodule = serverModule.get("helpDocId");
          const version = serverModule.get("helpVersion");
          const topic = options.helpTopic === undefined ? serverModule.get("helpTopic") : options.helpTopic;
          const isActive = activeModuleFound ? activeHelpModuleName === serverModule.get("id") : index === 0;
          const module = {
            module: currmodule,
            active: isActive,
            topic: topic === "" ? undefined : topic,
            version: version
          };
          currmodule && (isActive ? documentsOptions.documents.unshift(module) : documentsOptions.documents.push(module));
        });
        urlBuilder = this.getUrlBuilder({
          urlRoot: config.urlRoot
        });
        helpURL = urlBuilder && urlBuilder.buildHelpUrl(config.language, documentsOptions, {
          tenant: config.tenant,
          type: config.type,
          options: {
            search: "allModules"
          }
        }) || "";
        def.resolve(helpURL);
      }.bind(this), function(error) {
        def.reject(error);
      });
      return def.promise();
    },
    createServerModuleCollection: function() {
      return new ServerModuleCollection();
    },
    getUrlBuilder: function(options) {
      return new OTHHUrlBuilder(options);
    },
    getConfig: function(options) {
      var contextualConfig = {};
      if (options && options.commandData) {
        var alternateURL = options.commandData["URL"];
        contextualConfig.urlRoot = _.isString(alternateURL) && !_.isEmpty(alternateURL) ? alternateURL : undefined;
      }
      return _.extend({}, config, contextualConfig);
    }
  };
  return documentationUtils;
});