/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/properties", "csui/models/version" ], function(PropertiesCommand, VersionModel) {
  "use strict";
  var VersionPropertiesCommand = PropertiesCommand.extend({
    defaults: {
      signature: "VersionProperties",
      command_key: [ "versions_properties", "properties" ],
      scope: "multiple",
      commands: "csui/utils/commands/versions"
    },
    execute: function(status, options) {
      return this._executeWithoutSaveState(status, options);
    },
    _getAtLeastOneNode: function(status) {
      if (status.collection && status.nodes.length === 1) {
        return status.collection;
      }
      return status.nodes;
    }
  });
  return VersionPropertiesCommand;
});