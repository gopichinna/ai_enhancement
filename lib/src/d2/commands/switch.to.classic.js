/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "nuc/utils/url", "csui/utils/contexts/factories/search.query.factory", "dctmw/utils/rest.resources", "d2/utils/url.utils", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, _, $, CommandModel, Url, SearchQueryModelFactory, RestResources, urlUtils, lang) {
  "use strict";
  var METADATA = "metadata";
  var SwitchToClassicCommand = CommandModel.extend({
    defaults: {
      signature: "SwitchToClassic",
      name: lang.SwitchToClassicCommandName,
      classicURL: undefined
    },
    enabled: function(status, options) {
      var applicationScope = this.getApplicationScope(status.context || options && options.context);
      if ([ "", "node", "search" ].indexOf(applicationScope) === -1) {
        return false;
      }
      var switchToClassicAction = RestResources.getCurrentUser().get("MenuActions").get("SwitchToClassic");
      if (switchToClassicAction) {
        this.set("classicURL", switchToClassicAction.get("commandData").URL);
      }
      return !!this.get("classicURL");
    },
    getApplicationScope: function(context) {
      var applicationScope = context.getModel("applicationScope");
      return applicationScope && applicationScope.get("id");
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      var self = this;
      require([ "csui/utils/contexts/factories/node", "dctmw/utils/utils" ], function(NodeModelFactory, utils) {
        var context = status.context || options && options.context;
        var classicURL = self.getUrl(NodeModelFactory, context, status);
        var target = window.open("", "_blank");
        utils.openUrlInWindow(classicURL, target, true);
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },
    getUrl: function(NodeModelFactory, context) {
      var urlQueryParameters = this.getUrlQueryParameters(NodeModelFactory, context), urlQuery = Url.combineQueryString(urlQueryParameters), authUrl = urlUtils.injectAuthInfoInURL(this.get("classicURL"));
      return !urlQuery ? authUrl : Url.appendQuery(authUrl, urlQuery);
    },
    getUrlQueryParameters: function(NodeModelFactory, context) {
      var parameters = {};
      var applicationScope = this.getApplicationScope(context);
      var locateId;
      switch (applicationScope) {
       case "node":
        var node = this.getNode(NodeModelFactory, context);
        if (node) {
          if (node.get("path")) {
            locateId = node.get("path")["node_id"];
          } else {
            var nodeId = node.get("id");
            if (nodeId !== "repository") {
              locateId = nodeId;
              parameters["locatePath"] = node.get("r_folder_path")[0];
            }
          }
        }
        break;

       case "search":
        locateId = this.getSearchId(context);
        if (locateId) {
          parameters["locateTarget"] = "SearchWidget";
        }
        break;
      }
      if (locateId) {
        parameters["locateId"] = locateId;
      }
      return parameters;
    },
    getSearchId: function(context) {
      var searchNode = context.getModel(SearchQueryModelFactory);
      return searchNode.get("by-id");
    },
    getNode: function(NodeModelFactory, context) {
      var metadataNode = this.getMetaDataNode(context);
      if (metadataNode) {
        return metadataNode;
      } else {
        return context.getModel(NodeModelFactory);
      }
    },
    getMetaDataNode: function() {
      var browsingStates;
      var metaDataNode = browsingStates && _.find(browsingStates.models, function(model) {
        return model.get("id") === METADATA;
      });
      return metaDataNode;
    }
  });
  return SwitchToClassicCommand;
});