/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/log", "csui/models/fileupload" ], function(module, _, $, Backbone, log, FileUploadModel) {
  var FileUploadCollection = Backbone.Collection.extend({
    model: FileUploadModel,
    constructor: function FileUploadCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    state: function() {
      var failed = false, processing = false, processed = this.all(function(fileUpload) {
        var state = fileUpload.get("state"), rejected = state == "rejected";
        failed = failed || rejected;
        processing = processing || state == "processing";
        return rejected || state == "resolved";
      });
      return processed ? failed ? "rejected" : "resolved" : processing ? "processing" : "pending";
    },
    abort: function(state) {
      this.forEach(function(fileUpload) {
        var abortState = fileUpload.get("abortState");
        if (abortState) {
          fileUpload.abort();
          fileUpload.set("state", state);
        }
      });
    }
  });
  FileUploadCollection.version = "1.0";
  return FileUploadCollection;
});