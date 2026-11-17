/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/log", "csui/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior" ], function(module, _, $, log, Marionette, TabablesBehavior) {
  "use strict";
  var TabKeyBehavior = TabablesBehavior.extend({
    constructor: function TabKeyBehavior(options, view) {
      TabablesBehavior.prototype.constructor.apply(this, arguments);
    },
    _clearTabIndexes: function(view) {
      log.debug("_clearTabIndexes of TabKeyBehavior for view " + view.constructor.name) && console.log(log.last);
    }
  }, {});
  return TabKeyBehavior;
});