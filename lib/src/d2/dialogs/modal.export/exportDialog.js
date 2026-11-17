/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "d2/dialogs/modal.delete/deleteDialog", "hbs!d2/dialogs/modal.export/impl/exportDialog", "css!d2/dialogs/modal.export/impl/exportDialog" ], function(_, $, Marionette, Backbone, DeleteDialog, template) {
  let ModalExportDialog = DeleteDialog.extend({
    className: function() {
      return "d2-export-properties binf-modal binf-fade";
    },
    template: template,
    templateHelpers: function() {
      var templateVals = DeleteDialog.prototype.templateHelpers.apply(this, arguments);
      templateVals.exportTitleId = _.uniqueId("exportTitle");
      templateVals.exportMsgId = _.uniqueId("exportMsg");
      templateVals.includeSubFolderProperties = this.options.exportIncludeSubFolder;
      templateVals.ExportButtonLabel = this.options.primaryButtonLabel;
      return templateVals;
    },
    onHidden: function() {
      var exportWithSubFolder;
      if (this._result) {
        if (this.options.isExportDialog) {
          exportWithSubFolder = $("#export-include-sub-folder").prop("checked");
        }
      }
      this.destroy();
      if (this._result) {
        this._deferred.resolve({
          exportWithSubFolder: exportWithSubFolder
        });
      } else {
        this._deferred.reject(this._result);
      }
    }
  });
  ModalExportDialog._show = function(options) {
    return new ModalExportDialog(options).show();
  };
  return ModalExportDialog;
});