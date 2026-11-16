/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "d2/models/savedsearch/savedsearch.model", "i18n!d2/commands/nls/localized.strings" ], function(require, $, CommandModel, CommandHelper, SavedSearchModel, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-OpenSavedSearch",
      command_key: "D2-OpenSavedSearch",
      name: lang.CommandNameOpenCategory,
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node instanceof SavedSearchModel && node.isCategoryNode();
    },
    getSavedSearchNode: function(status) {
      return CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0);
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), node = this.getSavedSearchNode(status), context = status.context || options.context;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      if (node.isCategoryNode()) {
        require([ "d2/utils/contexts/factories/savedsearch.factory" ], function(SavedSearchCollectionFactory) {
          var containerNode = context.getCollection(SavedSearchCollectionFactory).node;
          containerNode.clear({
            silent: true
          });
          containerNode.set(node.attributes);
          deferred.resolve();
        }, deferred.reject);
      }
      return deferred.promise();
    }
  });
});