/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery" ], function($) {
  return {
    beforeStartup: function() {
      return $.Deferred().resolve("ext2 beforeStartup success").promise();
    },
    afterStartup: function() {
      return $.Deferred().reject("ext2 module failed afterStartup").promise();
    }
  };
});