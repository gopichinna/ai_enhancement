/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function($, CommandModel, CommandHelper, lang) {
  "use strict";
  const RemoveAssignments = CommandModel.extend({
    defaults: {
      signature: "Aviator-RemoveAssignment",
      command_key: "Aviator-RemoveAssignment",
      name: lang.CommandAviatorRemoveAssignment,
      scope: "multiple"
    },
    execute: function(status) {
      const nodes = CommandHelper.getAtLeastOneNode(status), deferred = $.Deferred();
      status.collection.remove(nodes.models);
      status.collection.skipCount = Math.max(0, status.collection.skipCount);
      status.collection.fetch({
        reload: false
      }).always(() => deferred.resolve());
      return deferred.promise();
    }
  });
  return RemoveAssignments;
});