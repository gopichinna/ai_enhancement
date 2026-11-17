/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "d2/commands/d2-locations", "i18n!d2/commands/nls/localized.strings" ], function(require, $, D2LocationsCommand, lang) {
  "use strict";
  return D2LocationsCommand.extend({
    defaults: {
      signature: "D2-TaskDocumentLocations",
      command_key: "D2-TaskDocumentLocations",
      name: lang.CommandNameLocations,
      verb: lang.CommandVerbLocations,
      scope: "single"
    },
    enabled: function(_status) {
      return D2LocationsCommand.prototype.enabled.apply(this, arguments);
    },
    execute: function(status) {
      let task = status.task;
      let viewType = status.originatingView?.viewType;
      const taskLocationsPath = `#d2/tasks/${task.get("id")}/docs?dropdown=locations&type=${viewType}`;
      this.routeToPath(status, taskLocationsPath);
      return $.Deferred().resolve().promise();
    }
  });
});