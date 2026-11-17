/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command" ], function(CommandModel) {
  "use strict";
  var TimelineCommand = CommandModel.extend({
    defaults: {
      signature: "Timeline"
    },
    enabled: function(status) {
      if (status) {
        return status.nodes !== undefined;
      } else {
        return false;
      }
    }
  });
  return TimelineCommand;
});