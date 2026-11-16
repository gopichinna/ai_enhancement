/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "d2/models/zip.status", "d2/models/export.status" ], function(module, ZipStatusModel, ExportStatusModel) {
  "use strict";
  return [ {
    handlerClass: ZipStatusModel,
    headerKey: "zipStatusModel",
    equals: {
      type: "d2_zip_and_download"
    }
  }, {
    handlerClass: ExportStatusModel,
    headerKey: "exportStatusModel",
    equals: {
      type: "d2_export_properties"
    }
  } ];
});