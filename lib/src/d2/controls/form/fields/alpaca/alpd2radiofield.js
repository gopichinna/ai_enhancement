/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2radiofield.view", "dctmw/controls/form/fields/alpaca/alpdctmwradiofield" ], function(_, Alpaca, RadioFieldView) {
  "use strict";
  Alpaca.Fields.D2RadioField = Alpaca.Fields.DctmwRadioField.extend({
    constructor: function D2RadioField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldViewClass: function() {
      return RadioFieldView;
    },
    getFieldType: function() {
      return "d2radio";
    },
    dctmwGetCollectionData: function() {
      return _.zip(this.schema["enum"], this.options.optionLabels).map(cur => ({
        id: cur[0],
        name: cur[1],
        category: cur[2]
      }));
    }
  });
  Alpaca.registerFieldClass("d2radio", Alpaca.Fields.D2RadioField, "bootstrap-csui");
  return Alpaca.Fields.D2RadioField;
});