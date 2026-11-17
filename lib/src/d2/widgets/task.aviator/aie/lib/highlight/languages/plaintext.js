/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function() {
  "use strict";
  function plaintext(hljs) {
    return {
      name: "Plain text",
      aliases: [ "text", "txt" ],
      disableAutodetect: true
    };
  }
  return plaintext;
});