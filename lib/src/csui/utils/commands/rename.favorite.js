/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/models/command", "csui/utils/commandhelper" ], function(require, _, $, CommandModel, CommandHelper) {
  "use strict";
  var RenameFavoriteCommand = CommandModel.extend({
    defaults: {
      signature: "FavoriteRename",
      command_key: [ "favorite_rename" ],
      scope: "single"
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      require([ "csui/controls/table/inlineforms/favorite/favorite.view" ], function(inlineFormFavoriteView) {
        var node = status.nodes && status.nodes.length === 1 && status.nodes.at(0);
        node.inlineFormView = inlineFormFavoriteView;
        node.set("csuiInlineFormErrorMessage", "dummy", {
          silent: true
        });
        node.unset("csuiInlineFormErrorMessage");
        deferred.resolve();
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });
  _.extend(RenameFavoriteCommand, {
    version: "1.0"
  });
  return RenameFavoriteCommand;
});