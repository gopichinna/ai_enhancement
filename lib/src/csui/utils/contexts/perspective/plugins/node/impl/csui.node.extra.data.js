/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return {
    getModelFields: function(options) {
      return {
        properties: []
      };
    },
    getModelExpand: function(options) {
      return {
        properties: [ "reserved_user_id" ]
      };
    }
  };
});