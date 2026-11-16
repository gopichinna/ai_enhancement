/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    publishFields: Object.freeze({
      OPTIONS: "publish_options",
      FOLDER: "folder-id",
      FILE_NAME: "input-file-name",
      VERSION: "checkin_version"
    }),
    publishOptions: Object.freeze({
      CURRENT_LOCATION: "current-location",
      BROWSE: "browse",
      HOME_CABINET: "home-cabinet",
      RENDITION: "rendition",
      VERSION: "version",
      DOWNLOAD: "download"
    })
  });
});