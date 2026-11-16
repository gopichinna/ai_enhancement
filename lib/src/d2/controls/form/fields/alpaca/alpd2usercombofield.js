/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/alpaca/alpd2combofield", "d2/controls/form/fields/userfields/d2usercombofield.view" ], function($, _, Backbone, Marionette, Alpaca, D2ComboField, D2UserComboFieldView) {
  "use strict";
  Alpaca.Fields.D2UserComboField = Alpaca.Fields.D2ComboField.extend({
    constructor: function D2UserComboField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2usercombo";
    },
    getFieldViewClass: function() {
      return D2UserComboFieldView;
    }
  });
  Alpaca.registerFieldClass("d2usercombo", Alpaca.Fields.D2UserComboField, "bootstrap-csui");
  return Alpaca.Fields.D2UserComboField;
});