/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "dctmw/utils/utils", "hbs!d2/dialogs/validation/impl/dialog.header" ], function($, _, Marionette, utils, headerTemplate) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "validation-dialog-header",
    template: headerTemplate,
    templateHelpers: function() {
      return {
        title: this.title,
        headerMessage: this.message,
        notMobile: !utils.isMobile()
      };
    },
    constructor: function WorkflowDocValidationHeaderView(options) {
      this.title = options.title || "";
      this.message = options.message || "";
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
});