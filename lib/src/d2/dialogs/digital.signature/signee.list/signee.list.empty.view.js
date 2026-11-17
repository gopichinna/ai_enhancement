/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "hbs!d2/dialogs/digital.signature/signee.list/impl/signee.list.empty.view", "css!d2/dialogs/digital.signature/signee.list/impl/signee.list.empty.view" ], function(Marionette, template) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-signee-list-empty",
    template: template,
    templateHelpers: function() {
      return {
        message: this.options.message
      };
    },
    constructor: function SigneeListEmptyView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
});