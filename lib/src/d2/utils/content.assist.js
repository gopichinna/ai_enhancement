/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "dctmw/server.adaptors/converters/node", "d2/utils/contexts/context.controller", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/constants" ], function(require, $, _, Backbone, Url, nodeConverter, D2ContextController, RestLinkrels, RestResources, utils, constants) {
  "use strict";
  return {
    getContentAssistConfig: function(options) {
      var context = options.context;
      var connector = context && context.getObject("connector");
      var links = RestResources.getCurrentRepository().get("links"), queryParams = {
        inline: true,
        "parent-id": options?.container?.get("parent_id")
      };
      var url = Url.appendQuery(Url.combine(RestLinkrels.getLink(links, RestLinkrels.D2_CONFIGURATIONS), "content-assist-configs"), Url.combineQueryString(queryParams));
      return $.ajax(connector.extendAjaxOptions({
        url: url
      }));
    },
    getContentAssistOptions: function(options) {
      var deferred = $.Deferred();
      var contentAssistConfig = RestResources.getContentAssistConfig();
      if (contentAssistConfig) {
        deferred.resolve(contentAssistConfig);
      } else {
        var me = this;
        this.getContentAssistConfig(options).done(function(response) {
          var entry = {};
          if (response && !_.isEmpty(response.entries) && response.entries[0]) {
            entry = response.entries[0].content;
            me.setContentAssistOptions(entry);
          }
          deferred.resolve(entry);
        }).fail(function() {
          deferred.reject(arguments);
        });
      }
      return deferred.promise();
    },
    setContentAssistOptions: function(contentAssistOption) {
      RestResources.setContentAssistConfig(contentAssistOption);
    },
    checkAndSaveAncestorInfo: function(args) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT), storeContainer = args?.storeContainer, ancestorInfoKey = args?.dataId + constants.StorageKey.ANCESTOR_INFO, ancestorInfoObject = args?.isFavorites ? {
        isFavorites: args?.isFavorites
      } : {
        parentContainer: args?.parentContainer,
        ancestors: args.ancestors?.models
      };
      if (storeContainer) {
        namedLocalStorage.set(ancestorInfoKey, ancestorInfoObject);
      }
    },
    checkAndRetrieveAncestorInfo: function(args) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT), restoreContainer = args?.restoreContainer, ancestorInfoKey = args?.dataId + constants.StorageKey.ANCESTOR_INFO, returnValue;
      if (restoreContainer) {
        returnValue = namedLocalStorage.get(ancestorInfoKey);
        namedLocalStorage.remove(ancestorInfoKey);
      }
      return returnValue;
    },
    clearAncestorInfo: function(dataId) {
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT), ancestorInfoKey = dataId + constants.StorageKey.ANCESTOR_INFO;
      if (ancestorInfoKey) {
        namedLocalStorage.remove(ancestorInfoKey);
      }
    }
  };
});