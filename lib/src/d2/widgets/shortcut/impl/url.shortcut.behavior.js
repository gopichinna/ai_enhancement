/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/shortcut/shortcut.behavior", "dctmw/utils/utils" ], function(ShortcutBehavior, utils) {
  "use strict";
  var URLShortcutBehavior = ShortcutBehavior.extend({
    onClick: function() {
      if (this.options.data.url) {
        utils.openUrlInWindow(this.options.data.url, window.open(""));
      }
    }
  });
  return URLShortcutBehavior;
});