/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/models/command" ], function($, CommandModel) {
  "use strict";
  const CMDCSUINavRecBin = CommandModel.extend({
    defaults: {
      signature: "RecycleBin"
    },
    enabled() {
      return false;
    },
    execute() {
      return $.Deferred().reject("Unsupported").promise();
    }
  });
  return CMDCSUINavRecBin;
});