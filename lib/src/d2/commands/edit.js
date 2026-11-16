/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/commands/reserve", "i18n!d2/commands/nls/localized.strings" ], function(_, ReserveCommand, lang) {
  "use strict";
  return ReserveCommand.extend({
    constructor: function EditCommand(attributes, options) {
      attributes = _.extend(attributes || {}, {
        signature: "D2-Edit",
        command_key: "D2-Edit",
        name: lang.CommandNameEdit,
        verb: lang.CommandVerbEdit,
        dialogTitle: lang.ReserveForEditDialogTitle
      });
      ReserveCommand.prototype.constructor.call(this, attributes, options);
    },
    execute: function(status, options) {
      options = options || {};
      options.edit = true;
      return ReserveCommand.prototype.execute.apply(this, [ status, options ]);
    }
  });
});