/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiurlfield", "d2/controls/form/fields/d2urlfield.view", "nuc/utils/base", "dctmw/controls/form/fields/alpaca/alpdctmwurlfield", "d2/utils/mass.update.utils" ], function(module, _, $, Backbone, Marionette, Alpaca, CsuiUrlField, D2URLFieldView, base, DctmwUrlField, MassUpdateUtils) {
  "user strict";
  Alpaca.Fields.D2UrlField = Alpaca.Fields.DctmwUrlField.extend({
    constructor: function D2UrlField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2url";
    },
    getFieldViewClass: function() {
      return D2URLFieldView;
    },
    handleValidate: function() {
      var ret = this.base();
      if (!ret && this.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.getValue())) {
        var valInfo = this.validation;
        valInfo["invalidPattern"]["status"] = true;
        valInfo["invalidPattern"]["message"] = "";
        return true;
      }
      return ret;
    }
  });
  Alpaca.registerFieldClass("d2url", Alpaca.Fields.D2UrlField, "bootstrap-csui");
  Alpaca.registerFieldClass("d2url", Alpaca.Fields.D2UrlField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.D2UrlField;
});