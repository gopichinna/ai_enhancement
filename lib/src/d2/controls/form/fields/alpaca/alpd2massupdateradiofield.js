/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/massupdatefields/d2massupdateradiofield.view" ], function($, _, Backbone, Marionette, Alpaca, D2MassUpdateRadioFieldView) {
  "use strict";
  Alpaca.Fields.D2MassUpdateRadioField = Alpaca.Fields.D2RadioField.extend({
    constructor: function D2MassUpdateRadioField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2massupdateradio";
    },
    getFieldViewClass: function() {
      return D2MassUpdateRadioFieldView;
    }
  });
  Alpaca.registerFieldClass("d2massupdateradio", Alpaca.Fields.D2MassUpdateRadioField, "bootstrap-csui");
  return Alpaca.Fields.D2MassUpdateRadioField;
});