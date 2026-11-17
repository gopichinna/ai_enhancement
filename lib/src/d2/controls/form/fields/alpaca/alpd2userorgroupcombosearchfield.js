/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/alpaca/alpd2combofield", "d2/controls/form/fields/userfields/d2userorgroupcombosearchfield.view" ], function($, _, Backbone, Marionette, Alpaca, D2ComboField, D2UserOrGroupComboSearchFieldView) {
  "use strict";
  Alpaca.Fields.D2UserOrGroupComboSearchField = Alpaca.Fields.D2ComboField.extend({
    constructor: function D2UserOrGroupComboSearchField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2userorgroupcombosearch";
    },
    getFieldViewClass: function() {
      return D2UserOrGroupComboSearchFieldView;
    }
  });
  Alpaca.registerFieldClass("d2userorgroupcombosearch", Alpaca.Fields.D2UserOrGroupComboSearchField, "bootstrap-csui");
  return Alpaca.Fields.D2UserOrGroupComboSearchField;
});