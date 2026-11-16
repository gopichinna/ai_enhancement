/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiurlfield", "d2/controls/form/fields/d2urlfield.view", "nuc/utils/base", "d2/utils/mass.update.utils" ], function(module, _, $, Backbone, Marionette, Alpaca, CsuiUrlField, URLFieldView, base, MassUpdateUtils) {
  Alpaca.Fields.D2UrlField = Alpaca.Fields.CsuiUrlField.extend({
    d2urlregexps: /(^(http|https|ftp):\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\:[0-9]{1,5})?(\/.*)?$/i,
    constructor: function D2UrlField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    setup: function() {
      this.base();
      this.schema.pattern = this.d2urlregexps;
    },
    showField: function() {
      var id = this.id;
      this.fieldView = new URLFieldView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        value: this.data,
        readonly: true,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
      return;
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