/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/download", "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings" ], function(DownloadCommand, Url, lang) {
  "use strict";
  var VersionDownloadCommand = DownloadCommand.extend({
    defaults: {
      signature: "VersionDownload",
      command_key: [ "versions_download", "open" ],
      name: lang.CommandNameDownload,
      verb: lang.CommandVerbDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      scope: "single"
    },
    _getContentUrl: function(node, options, action, token) {
      var url = Url.combine(node.connector.connection.url, "nodes", node.get("id"), "versions", node.get("version_number"), "content");
      return url + "?action=" + action + "&token=" + encodeURIComponent(token);
    }
  });
  return VersionDownloadCommand;
});