/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commandhelper", "d2/commands/add.version", "d2/dialogs/vdoc.add.version/vdoc.add.version.manager", "dctmw/utils/rest.resources", "d2/utils/concurrency.manager", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, CommandHelper, AddVersionCommand, VDAddVersionManager, RestResources, ConcurrencyManager, lang) {
  "use strict";
  return AddVersionCommand.extend({
    defaults: {
      signature: "D2-VDAddVersion",
      command_key: "D2-VDAddVersion",
      name: lang.CommandNameAddVersion,
      scope: "single",
      verb: lang.CommandVerbAddVersion
    },
    execute: function(status, options) {
      options = options || {};
      options.context = options.context || status.context;
      if (options.disableConcurrentProcess !== true) {
        if (ConcurrencyManager.isProcessPending(CommandHelper.getAtLeastOneNode(status))) {
          return;
        }
      }
      return new VDAddVersionManager(status, options, this).execute();
    }
  });
});