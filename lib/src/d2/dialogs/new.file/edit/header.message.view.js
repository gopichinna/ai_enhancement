/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "hbs!d2/dialogs/new.file/edit/impl/header.message", "css!d2/dialogs/new.file/edit/impl/header.message" ], function(Marionette, template) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-header-message-container",
    template: template,
    ui: {
      headerMessageLabel: ".header-message-label"
    },
    templateHelpers: function() {
      return {
        message: this.options.message,
        mode: this.options.mode
      };
    },
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.$el.addClass(this.options.mode);
    }
  });
});