/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, CommandHelper, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-ApplyPropertyToAllFiles",
      command_key: "D2-ApplyPropertyToAllFiles",
      name: lang.ApplyToAllFilesCommandName,
      scope: "single"
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return node.get("d2_field_value_count") !== node.get("total_count");
    },
    execute: function(status, options) {
      options = options || {};
      var deferred = $.Deferred();
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var node = CommandHelper.getJustOneNode(status);
      node.previousFieldValueCount = _.isUndefined(node.previousFieldValueCount) ? node.get("d2_field_value_count") : node.previousFieldValueCount;
      node.previousObjectIds = _.isUndefined(node.previousObjectIds) ? node.get("objectIds") : node.previousObjectIds;
      node.set({
        d2_field_value_count: node.get("total_count") || options.totalCount,
        objectIds: _.pluck(node.get("massUpdateNodes"), "r_object_id")
      }, {
        silent: options.silent
      });
      return deferred.resolve().promise();
    }
  });
});