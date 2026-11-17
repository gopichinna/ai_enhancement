/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/ally" ], function(ally) {
  "use strict";
  function findFocusables(selector, rootElement) {
    var context = rootElement ? rootElement.querySelector(selector) : selector;
    return ally.query.focusable({
      context: context,
      includeContext: false,
      strategy: "quick"
    });
  }
  function isFocusable(element) {
    return ally.is.focusable(element);
  }
  return {
    findFocusables: findFocusables,
    isFocusable: isFocusable
  };
});