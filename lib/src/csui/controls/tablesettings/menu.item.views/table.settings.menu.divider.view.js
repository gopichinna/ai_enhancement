/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette" ], function(Marionette, template) {
  "use strict";
  const TableSettingsMenuDividerView = Marionette.ItemView.extend({
    template: false,
    tagName: "otc-menudivider",
    constructor: function TableSettingsMenuDividerView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
  return TableSettingsMenuDividerView;
});