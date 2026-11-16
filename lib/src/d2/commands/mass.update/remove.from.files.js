/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function($, _, CommandModel, CommandHelper, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-RemovePropertyFromFiles",
      command_key: "D2-RemovePropertyFromFiles",
      name: lang.RemoveFromFilesCommandName,
      scope: "multiple"
    },
    enabled: function(status) {
      var node = CommandHelper.getAtLeastOneNode(status).first();
      return node.get("d2_field_value_count") !== 0;
    },
    execute: function(status, options) {
      options = options || {};
      var deferred = $.Deferred();
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var nodes = CommandHelper.getAtLeastOneNode(status);
      nodes.each(function(node) {
        node.previousFieldValueCount = _.isUndefined(node.previousFieldValueCount) ? node.get("d2_field_value_count") : node.previousFieldValueCount;
        node.previousObjectIds = _.isUndefined(node.previousObjectIds) ? node.get("objectIds") : node.previousObjectIds;
        var attrs = {
          d2_field_value_count: 0,
          objectIds: []
        };
        if (node.get("selectRows") && !options.ignoreSelectionUpdate) {
          attrs["csuiIsSelected"] = false;
          attrs["selectable"] = false;
        }
        node.set(attrs, {
          silent: options.silent
        });
      });
      return deferred.resolve().promise();
    }
  });
});