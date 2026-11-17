/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/base", "csui/utils/commandhelper", "csui/models/favorite.model", "csui/models/command", "dctmw/server.adaptors/converters/node", "i18n!d2/commands/nls/localized.strings" ], function($, _, base, CommandHelper, FavoriteModel, CommandModel, nodeConverter, lang) {
  "use strict";
  var BWSAddFavoriteCommand = CommandModel.extend({
    defaults: {
      signature: "D2-BWSAddFavorite",
      command_key: "D2-BWSAddFavorite",
      name: lang.BWSAddedToFavorite,
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return !!(node && node.get("id") && !node.get("favorite") && !nodeConverter.isNonDCTMNode(node));
    },
    execute: function(status) {
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status);
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      if (!node || !node.get("id")) {
        return deferred.reject("Invalid node");
      }
      var favModel = new FavoriteModel({
        id: node.get("id"),
        name: node.get("name")
      }, {
        connector: node.connector
      });
      favModel.addToFavorites().done(function() {
        node.set("favorite", true);
        deferred.resolve({
          success: true
        });
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });
  return BWSAddFavoriteCommand;
});