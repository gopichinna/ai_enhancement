/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!d2/dialogs/create.relation/impl/empty.views/empty.relations" ], function(_, $, Marionette, emptyListTemplate) {
  var EmptyListView = Marionette.ItemView.extend({
    constructor: function EmptyListView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "cs-emptylist-container",
    template: emptyListTemplate
  });
  return EmptyListView;
});