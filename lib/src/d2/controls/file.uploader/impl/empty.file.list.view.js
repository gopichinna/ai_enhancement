/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "i18n!d2/controls/file.uploader/impl/nls/lang", "hbs!d2/controls/file.uploader/impl/empty.file.list" ], function(_, $, Backbone, Marionette, lang, template) {
  "use strict";
  var EmptyFileListView = Marionette.ItemView.extend({
    className: "empty-file-list",
    template: template,
    constructor: function UploadedFileView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      emptyAddFile: ".empty-add-file"
    },
    events: {
      "click @ui.emptyAddFile": "onEmptyAddFile",
      "keydown @ui.emptyAddFile": "onEmptyAddFileKeyPress"
    },
    templateHelpers: function() {
      return {
        emptyFileListMessage: lang.emptyListMessage,
        addFileToolTip: lang.addFileToolTip,
        addFileAria: lang.addFileAria
      };
    },
    onEmptyAddFile: function() {
      this.options.parentView.onAddFile();
    },
    onEmptyAddFileKeyPress: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onEmptyAddFile();
        break;

       default:
        return;
      }
    },
    onShow: function() {
      this.ui.emptyAddFile.trigger("focus");
    }
  });
  return EmptyFileListView;
});