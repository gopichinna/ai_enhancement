/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants" ], function(Constants) {
  "use strict";
  return [ {
    equals: {
      type: [ Constants.Types.DOCUMENT, Constants.Types.EMAIL ]
    },
    important: true,
    module: "json!d2/server.adaptors/impl/perspectives/document.overview.json",
    sequence: 95
  } ];
});