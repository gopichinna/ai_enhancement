/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command" ], function(_, $, CommandModel) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-WidgetTableQueryForm"
    },
    enabled: function() {
      return true;
    }
  });
});