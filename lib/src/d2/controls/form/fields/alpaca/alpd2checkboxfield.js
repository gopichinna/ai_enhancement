/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2checkboxfield.view", "dctmw/controls/form/fields/alpaca/alpdctmwcheckboxfield" ], function(Alpaca, D2CheckboxFieldView) {
  "use strict";
  Alpaca.Fields.D2CheckboxField = Alpaca.Fields.DctmwCheckboxField.extend({
    constructor: function D2CheckboxField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2checkbox";
    },
    getFieldViewClass: function() {
      return D2CheckboxFieldView;
    },
    dctmwCheckboxDataConverter: function(data) {
      return {
        id: data.value,
        name: data.text,
        category: data.category
      };
    }
  });
  Alpaca.registerFieldClass("d2checkbox", Alpaca.Fields.D2CheckboxField, "bootstrap-csui");
  return Alpaca.Fields.D2CheckboxField;
});