/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/bws/bws.properties", "i18n!d2/commands/nls/localized.strings" ], function(BWSPropertiesCommand, lang) {
  "use strict";
  return BWSPropertiesCommand.extend({
    defaults: {
      signature: "BWS-Members",
      command_key: "BWS-Members",
      name: lang.commandNameBWSMembers,
      scope: "single"
    },
    _setSelectedTabPanel: function(node) {
      node.set("initialPanel", "bws_members", {
        silent: true
      });
    }
  });
});