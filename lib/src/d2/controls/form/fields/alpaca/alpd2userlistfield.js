/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/alpaca/alpd2listfield", "d2/controls/form/fields/userfields/d2userlistfield.view" ], function(_, $, Backbone, Marionette, Alpaca, D2ListField, D2UserListFieldView) {
  "use strict";
  Alpaca.Fields.D2UserListField = Alpaca.Fields.D2ListField.extend({
    constructor: function D2UserListField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2userlist";
    },
    getFieldViewClass: function() {
      return D2UserListFieldView;
    }
  });
  Alpaca.registerFieldClass("d2userlist", Alpaca.Fields.D2UserListField, "bootstrap-csui");
  return Alpaca.Fields.D2UserListField;
});