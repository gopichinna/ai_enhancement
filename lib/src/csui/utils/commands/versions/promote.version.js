/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/versions/nls/localized.strings", "csui/utils/commandhelper", "csui/models/command", "csui/models/version", "csui/utils/base", "csui/utils/url" ], function(_, $, versionLang, CommandHelper, Command, VersionModel, base, Url) {
  "use strict";
  var PromoteVersionCommand = Command.extend({
    defaults: {
      signature: "PromoteVersion",
      command_key: [ "versions_promote", "promote" ],
      name: versionLang.CommandNamePromoteVersion,
      verb: versionLang.CommandVerbPromoteVersion,
      scope: "single"
    },
    enabled: function(status, options) {
      return Command.prototype.enabled.apply(this, arguments);
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      this._confirmAction(status, options).done(function() {
        deferred.resolve();
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },
    _confirmAction: function(status, options) {
      var deferred = $.Deferred(), node = status.container, newVersion = CommandHelper.getJustOneNode(status).clone(), connector = status.container && status.container.connector || newVersion.connector;
      require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        var data = {};
        newVersion.save(undefined, {
          data: data,
          type: "POST",
          wait: true,
          url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/" + newVersion.get("id") + "/versions/" + newVersion.get("version_number") + "/promote")
        }).done(function() {
          if (!!node) {
            newVersion.fetch().done(function() {
              if (node.versions || !!node.attributes && !!node.attributes.versions) {
                newVersion.isLocallyCreated = true;
                !!node.versions && node.versions.add(newVersion, {
                  at: 0
                });
                if (Array.isArray(node.get("versions"))) {
                  !!node.attributes && !!node.attributes.versions && node.attributes.versions.push(newVersion.attributes);
                }
              }
              deferred.resolve();
              GlobalMessage.showMessage("success", versionLang.MessageVersionPromoted);
            });
          } else {
            deferred.resolve();
            GlobalMessage.showMessage("success", versionLang.MessageVersionPromoted);
          }
        }).fail(function(error) {
          deferred.reject();
          if (error) {
            var errorObj = new base.Error(error);
            GlobalMessage.showMessage("error", errorObj.message);
          }
        });
      });
      return deferred.promise();
    }
  });
  return PromoteVersionCommand;
});