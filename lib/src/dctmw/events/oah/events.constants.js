/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    OAM: Object.freeze({
      PARAM_EQ: "==",
      PARAM_SEPARATOR: "!!",
      PARAM_ID: "oam_id",
      PARAM_CONTAINER_UID: "oam_cuid",
      PARAM_GLOBAL: "oam_global",
      PARAM_SENDER: "oam_sender",
      PARAM_VALUE: "oam_value",
      PARAM_TARGET_TYPE: "oam_target_type",
      PARAM_TARGET_ID: "oam_target_id",
      PARAM_EXCLUDED_TYPE: "oam_excluded_type",
      PARAM_EXCLUDED_ID: "oam_excluded_id",
      PARAM_VOLATILE: "oam_volatile",
      PARAM_SPLIT_SEPARATOR: String.fromCharCode(172),
      SEP_ENCODED: "&#33;&#33;",
      EQ_ENCODED: "&#61;&#61;"
    })
  });
});