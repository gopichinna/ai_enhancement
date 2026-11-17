/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/commandhelper", "d2/commands/download", "d2/utils/constants", "i18n!csui/utils/commands/nls/localized.strings" ], function(_, CommandHelper, DownloadCommand, constants, lang) {
  "use strict";
  return DownloadCommand.extend({
    defaults: {
      signature: "DownloadC2Override",
      command_key: "DownloadC2Override",
      name: lang.CommandNameDownloadC2Override,
      verb: lang.CommandNameDownloadC2Override,
      doneVerb: lang.CommandDoneVerbDownload,
      c2_override: true
    },
    getDownloadLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature")) + "?c2_override=true";
    }
  });
});