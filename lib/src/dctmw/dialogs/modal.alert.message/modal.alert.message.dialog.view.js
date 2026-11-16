/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "hbs!dctmw/dialogs/modal.alert.message/impl/modal.alert.message.dialog", "css!dctmw/dialogs/modal.alert.message/impl/modal.alert.message.dialog" ], function(Marionette, PerfectScrollingBehavior, template) {
  "use strict";
  return Marionette.ItemView.extend({
    template: template,
    className: "custom-message-body",
    templateHelpers: function() {
      return {
        message: this.options.message
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "#message-body-container",
        suppressScrollX: true
      }
    },
    constructor: function(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
});