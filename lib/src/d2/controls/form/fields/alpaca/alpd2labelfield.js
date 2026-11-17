/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/alpaca/js/alpaca.lite", "dctmw/controls/form/fields/alpaca/alpdctmwlabelfield" ], function(Alpaca) {
  "use strict";
  Alpaca.Fields.D2LabelField = Alpaca.Fields.DctmwLabelField.extend({
    constructor: function D2LabelField(container, data, options, schema, view, connector, onError) {
      console.warn(`@Deprecated: Use 'dctmwlabel' field type instead`);
      this.base(container, data, options, schema, view, connector, onError);
    }
  });
  Alpaca.registerFieldClass("d2label", Alpaca.Fields.D2LabelField, "bootstrap-csui");
  return Alpaca.Fields.D2LabelField;
});