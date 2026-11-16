/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/controls/table/rows/error/impl/errorrow", "css!csui/controls/table/rows/error/impl/errorrow" ], function(_, Marionette, template) {
  var ErrorRowView = Marionette.ItemView.extend({
    className: "csui-table-error-view binf-container-fluid",
    template: template,
    templateHelpers: function() {
      return {
        errorMessage: this.options.errorMessage ? this.options.errorMessage : ""
      };
    },
    ui: {},
    events: {},
    constructor: function ErrorRowView(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return ErrorRowView;
});