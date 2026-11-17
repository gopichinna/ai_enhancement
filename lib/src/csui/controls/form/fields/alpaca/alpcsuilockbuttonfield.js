/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/lockbuttonfield.view", "csui/utils/base" ], function(module, _, $, Backbone, Marionette, Alpaca, LockButtonFieldView, base) {
  Alpaca.Fields.CsuiLockButtonField = Alpaca.Fields.CsuiReserveButtonField.extend({
    constructor: function CsuiLockButtonField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "otcs_lock_button";
    },
    showField: function() {
      var id = this.id;
      var id4Label, labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length == 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      this.options.labelId = id4Label;
      this.fieldView = new LockButtonFieldView(_.extend(this));
      this.fieldView.$el.attr("id", _.uniqueId(this.id));
      var $field = $("<div>").addClass("alpaca-control");
      this.containerItemEl.find(".alpaca-control").replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
    }
  });
  Alpaca.registerFieldClass("otcs_lock_button", Alpaca.Fields.CsuiLockButtonField);
  return $.alpaca.Fields.CsuiLockButtonField;
});