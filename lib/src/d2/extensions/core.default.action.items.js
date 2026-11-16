/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "d2/utils/vdoc.utils" ], function(constants, vdUtils) {
  "use strict";
  return [ {
    decides: function(node) {
      return vdUtils.isVDSnapshot(node);
    },
    signature: "D2-OpenVDocSnapshot",
    sequence: 9
  }, {
    type: constants.Types.TASK,
    signature: "D2-OpenTask",
    sequence: 9
  }, {
    type: constants.Types.WORKFLOW,
    signature: "D2-OpenWorkflow",
    sequence: 9
  }, {
    type: constants.Types.SAVED_SEARCH_OBJECT,
    signature: "D2-OpenSavedSearch",
    sequence: 9
  }, {
    type: constants.Types.EMAIL,
    signature: "Open",
    sequence: 9
  }, {
    type: constants.Types.COLLECTIONS,
    signature: "D2-GoToD2Collection",
    sequence: 9
  } ];
});