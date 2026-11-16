/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "dctmw/controls/behaviors/delegated.click.behavior" ], function(DelegatedClickBehavior) {
  "use strict";
  var ShortcutBehavior = DelegatedClickBehavior.extend({
    constructor: function ShortcutBehavior(options, view) {
      options = options || {};
      options.registerClickEventListener = false;
      ShortcutBehavior.__super__.constructor.call(this, options, view);
    },
    onRender: function() {
      ShortcutBehavior.__super__.onRender.apply(this, arguments);
    }
  });
  return ShortcutBehavior;
});