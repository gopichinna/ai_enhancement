/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command", "d2/utils/constants", "dctmw/server.adaptors/converters/node" ], function(_, CommandModel, constants, nodeConverter) {
  "use strict";
  var Favorites2Command = CommandModel.extend({
    defaults: {
      signature: "D2-Favorite",
      command_key: "D2-Favorite",
      scope: "single"
    },
    enabled: function(status) {
      return !(status.collection && nodeConverter.isNonDCTMNode(status.collection.node));
    }
  });
  return Favorites2Command;
});