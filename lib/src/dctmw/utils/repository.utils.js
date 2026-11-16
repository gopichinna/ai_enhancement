/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/utils/rest.resources", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/constants" ], function(_, Backbone, RestResources, authStorage, constants) {
  "use strict";
  function findApplication(repo, orderedSearchProperties, searchValue) {
    if (!!repo && repo.get("is_matrix_application_mode") === true) {
      return _.chain(orderedSearchProperties).map(function(prop) {
        return _.find(repo.get("applications"), function(a) {
          return a[prop] === searchValue;
        });
      }).compact().first().value();
    }
    return null;
  }
  function getApplication(nameOrParam, matchNameFirst, useDefault, productInfoModel, repoName) {
    productInfoModel = productInfoModel && productInfoModel.repositories instanceof Backbone.Collection ? productInfoModel : RestResources.getProductInfo();
    repoName = repoName || authStorage.getCurrTabData()[constants.AuthStorage.REPOSITORY];
    var repo = productInfoModel && productInfoModel.repositories instanceof Backbone.Collection && productInfoModel.repositories.find(function(model) {
      return model.get("name") === repoName;
    });
    var app, propOrder = [ "applicationName" ], fName = matchNameFirst ? "push" : "unshift";
    Array.prototype[fName].call(propOrder, "applicationParameter");
    app = findApplication(repo, propOrder, nameOrParam);
    if (!app && useDefault && repo.get("default_application_name")) {
      app = findApplication(repo, [ "applicationName" ], repo.get("default_application_name"));
    }
    return app;
  }
  return {
    getMatchingApplicationParameter: function(searchTerm, useDefaultOnNoMatch, productInfoModel, repoName) {
      var app = getApplication(searchTerm, true, useDefaultOnNoMatch, productInfoModel, repoName);
      return app ? app["applicationParameter"] : undefined;
    },
    getMatchingApplicationName: function(searchTerm, useDefaultOnNoMatch, productInfoModel, repoName) {
      var app = getApplication(searchTerm, false, useDefaultOnNoMatch, productInfoModel, repoName);
      return app ? app["applicationName"] : undefined;
    }
  };
});