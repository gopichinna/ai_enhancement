/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/utils/commands/open", "csui/utils/url" ], function($, OpenCommand, Url) {
  "use strict";
  var VersionOpenCommand = OpenCommand.extend({
    defaults: {
      signature: "VersionOpen",
      command_key: [ "versions_open", "open" ],
      scope: "single"
    },
    checkPermission: function(version) {
      var permitted = false;
      if (version.actions.get("versions_open") || version.actions.get("open")) {
        permitted = true;
      } else {
        permitted = false;
      }
      return $.Deferred().resolve(permitted).promise();
    },
    _showOverview: function(version, options) {
      var deferred = $.Deferred();
      require([ "csui/utils/contexts/factories/next.version" ], function(NextVersionModelFactory) {
        var nextVersion = options.context.getModel(NextVersionModelFactory);
        nextVersion.set({
          id: version.get("id"),
          version_number: version.get("version_number")
        });
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },
    _getContentUrl: function(node, options, action, token) {
      var url = Url.combine(node.connector.connection.url, "nodes", node.get("id"), "versions", node.get("version_number"), "content");
      return url + "?action=" + action + "&token=" + encodeURIComponent(token);
    }
  });
  return VersionOpenCommand;
});