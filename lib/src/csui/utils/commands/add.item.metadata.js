/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/log", "csui/utils/commandhelper", "csui/models/command" ], function(module, require, _, $, Backbone, log, CommandHelper, CommandModel) {
  var AddItemMetadataCommand = CommandModel.extend({
    defaults: {
      signature: "AddItemMetadata",
      command_key: "Add_Item",
      scope: "single"
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      require([ "csui/widgets/metadata/metadata.add.item.controller" ], function(MetadataAddItemController) {
        var metadataAddItemController = new MetadataAddItemController();
        metadataAddItemController.displayForm(status, options).done(function() {
          deferred.resolve.apply(deferred, arguments);
        }).fail(function() {
          deferred.reject.apply(deferred, arguments);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });
  AddItemMetadataCommand.version = "1.0";
  return AddItemMetadataCommand;
});