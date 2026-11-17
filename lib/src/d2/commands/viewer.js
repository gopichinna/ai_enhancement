/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commandhelper", "d2/commands/open" ], function(CommandHelper, OpenCommand) {
  "use strict";
  var FullViewCommand = OpenCommand.extend({
    defaults: {
      signature: "D2-Viewer",
      command_key: "D2-Viewer",
      scope: "single",
      skipPreview: false
    }
  });
  return FullViewCommand;
});