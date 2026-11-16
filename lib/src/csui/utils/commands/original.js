/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/command" ], function(CommandModel) {
  "use strict";
  var OriginalCommand = CommandModel.extend({
    defaults: {
      signature: "Original"
    }
  });
  return OriginalCommand;
});