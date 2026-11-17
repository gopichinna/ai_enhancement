/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/models/command", "csui/utils/url", "csui/utils/commandhelper", "csui/utils/commands/open.mixin" ], function(require, _, CommandModel, Url, CommandHelper, OpenMixin) {
  "use strict";
  var config = _.extend({
    forceDownloadMimeTypes: [ "text/html" ]
  }, require.moduleConfig("csui/utils/commands/open"));
  var OpenBaseCommand = CommandModel.extend({
    openDelegates: null,
    getCommandKey: function() {
      if (!this.openDelegates) {
        return [];
      }
      var commandKeys = this.openDelegates.map(function(delegate) {
        var command = delegate.get("command");
        return command.getCommandKey && command.getCommandKey() || command.get("command_key") || [];
      });
      return _.chain(commandKeys).flatten().invoke("toLowerCase").unique().value();
    },
    enabled: function(status, options) {
      if (!this.openDelegates) {
        return false;
      }
      var node = CommandHelper.getJustOneNode(status);
      if (!node) {
        return false;
      }
      var type = node.get("type");
      if (!(type && _.contains([ "144", "749", "736", "801" ], type.toString()))) {
        return false;
      }
      var fallbackCommand = this.openDelegates.last().get("command");
      return fallbackCommand.enabled(status, options);
    },
    execute: function(status, options) {
      let self = this, node = CommandHelper.getJustOneNode(status);
      return this.checkRendition(status, options).done(function(hasRendition) {
        if (hasRendition) {
          return self._openDocument(node);
        }
        var delegatedCommand = self.getDelegatedCommand(status, options);
        return delegatedCommand.execute(status, options);
      });
    },
    _openDocument: function(node) {
      let cgiUrl = new Url(node.connector.connection.url).getCgiScript(), openTarget = "_self", query = {
        func: "doc.fetchcsui",
        nodeid: node.get("id")
      };
      let versionNumber = node.get("version_number");
      if (node.get("hasMajorVersion") && node.get("rendition_type")) {
        const versions = node.get("data")?.versions;
        versionNumber = versions && this.getVersionNumber(versions, node);
      }
      if (!!versionNumber) {
        query.vernum = versionNumber;
      }
      if (_.indexOf(config.forceDownloadMimeTypes, node.get("mime_type")) === -1) {
        openTarget = "_blank";
      }
      let downloadUrl = Url.appendQuery(cgiUrl, Url.combineQueryString(query));
      window.open(downloadUrl, openTarget);
    },
    getDelegatedCommand: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      return node && this.openDelegates.findByNode(node, status, options);
    }
  });
  OpenMixin.mixin(OpenBaseCommand.prototype);
  return OpenBaseCommand;
});