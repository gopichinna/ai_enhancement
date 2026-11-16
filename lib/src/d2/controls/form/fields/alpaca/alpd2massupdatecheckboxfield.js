/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/massupdatefields/d2massupdatecheckboxfield.view" ], function($, _, Backbone, Marionette, Alpaca, D2MassUpdateCheckboxFieldView) {
  "use strict";
  Alpaca.Fields.D2MassUpdateCheckboxField = Alpaca.Fields.CsuiCheckboxField.extend({
    constructor: function D2MassUpdateCheckboxField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2massupdatecheckbox";
    },
    getFieldViewClass: function() {
      return D2MassUpdateCheckboxFieldView;
    }
  });
  Alpaca.registerFieldClass("d2massupdatecheckbox", Alpaca.Fields.D2MassUpdateCheckboxField, "bootstrap-csui");
  return Alpaca.Fields.D2MassUpdateCheckboxField;
});