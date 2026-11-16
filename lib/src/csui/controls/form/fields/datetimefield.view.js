/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/types/date", "csui/controls/form/fields/impl/datebasefield.view" ], function(date, DateBaseFieldView) {
  "use strict";
  var DateTimeFieldView = DateBaseFieldView.extend({
    className: DateBaseFieldView.prototype.className + " cs-datetime",
    format: date.exactDateTimeFormat,
    inputType: "datetime-local",
    inputStep: "1",
    constructor: function DateTimeFieldView(options) {
      DateBaseFieldView.apply(this, arguments);
    },
    getDisplayValue: function() {
      return this.$el.find(":input")[0].value;
    }
  });
  return DateTimeFieldView;
});