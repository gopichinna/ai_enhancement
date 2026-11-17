/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/dialogs/file.open/file.open.dialog", "hbs!dctmw/dialogs/file.open/impl/file.open" ], function(module, _, $, Marionette, CsuiFileOpenDialog, template) {
  "use strict";
  var FileOpenDialog = CsuiFileOpenDialog.extend({
    className: function() {
      return CsuiFileOpenDialog.prototype.className + " dctm-file-open";
    },
    template: template,
    templateHelpers: function() {
      return {
        multiple: this.options.multiple ? "multiple" : "",
        directory: this.options.directory ? "webkitdirectory directory" : ""
      };
    },
    constructor: function FileOpenDialog(options) {
      CsuiFileOpenDialog.prototype.constructor.call(this, options);
    }
  });
  return FileOpenDialog;
});