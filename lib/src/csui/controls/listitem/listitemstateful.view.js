/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/listitem/listitemstandard.view", "hbs!csui/controls/listitem/impl/listitemstateful", "css!csui/controls/listitem/impl/listitemstateful" ], function(_, $, Marionette, StandardListItem, itemTemplate) {
  var StatefulListItem = StandardListItem.extend({
    className: "SLI binf-list-group-item",
    template: itemTemplate,
    constructor: function StatefulListItem() {
      StandardListItem.apply(this, arguments);
    }
  });
  return StatefulListItem;
});