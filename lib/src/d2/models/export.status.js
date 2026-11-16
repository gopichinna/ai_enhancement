/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/models/zip.status", "i18n!d2/utils/job.tracker/impl/nls/lang" ], function(_, $, Backbone, ZipStatus, lang) {
  return ZipStatus.extend({
    getHeaderTitle: function() {
      var headerTitle;
      switch (this.get("status")) {
       case "COMPLETED":
        headerTitle = lang.ExportCompletedHeaderTitle;
        break;

       case "INPROGRESS":
        headerTitle = lang.ExportProcessingHeaderTitle;
        break;

       case "CANCELLED":
        headerTitle = lang.ExportAbortedTitle;
        break;

       default:
        headerTitle = lang.ExportProcessingHeaderTitle;
      }
      return headerTitle;
    }
  });
});