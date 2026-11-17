/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/controls/listitem/impl/inline.menu/inline.menu.view", "css!csui/controls/listitem/impl/inline.menu/inline.menu" ], function(module, InlineMenuViewImpl) {
  var InlineMenuView = InlineMenuViewImpl.extend({
    constructor: function InlineMenuView(options) {
      InlineMenuViewImpl.prototype.constructor.apply(this, arguments);
    }
  });
  return InlineMenuView;
});