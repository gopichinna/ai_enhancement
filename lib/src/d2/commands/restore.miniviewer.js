/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandModel, lang) {
  "use strict";
  var RestoreMiniviewer = CommandModel.extend({
    defaults: {
      signature: "D2-RestoreMiniviewer",
      name: lang.CommandRestoreMiniviewer,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status) {
      var deferred = $.Deferred();
      if (status && status.originatingView) {
        status.originatingView.trigger("restore:additional:widget");
      }
      return deferred.resolve().promise();
    }
  });
  return RestoreMiniviewer;
});