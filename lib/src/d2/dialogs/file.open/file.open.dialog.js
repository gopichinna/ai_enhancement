/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/dialogs/file.open/file.open.dialog" ], function(FileOpenDialogView) {
  "use strict";
  return FileOpenDialogView.extend({
    constructor: function D2FileOpenDialog(options) {
      FileOpenDialogView.prototype.constructor.call(this, options);
    },
    events: {
      ...FileOpenDialogView.prototype.events,
      "cancel @ui.fileInput": "_cancelFileSelect"
    },
    _cancelFileSelect: function() {
      this.trigger("cancel:dialog");
    }
  });
});