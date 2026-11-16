/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  return {
    get search() {
      return location.search;
    },
    get href() {
      return location.href;
    },
    get hash() {
      return location.hash;
    }
  };
});