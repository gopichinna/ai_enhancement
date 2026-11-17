/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/alpaca/alpcsuiurlfield", "dctmw/controls/form/fields/dctmwurlfield.view", "nuc/utils/base" ], function(_, $, Backbone, Marionette, Alpaca, CsuiUrlField, URLFieldView) {
  Alpaca.Fields.DctmwUrlField = Alpaca.Fields.CsuiUrlField.extend({
    dctmwUrlregexps: /(^(http|https|ftp):\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\:[0-9]{1,5})?(\/.*)?$/i,
    constructor: function DctmwUrlField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    setup: function() {
      this.base();
      this.schema.pattern = this.dctmwUrlregexps;
    },
    getFieldViewClass: function() {
      return URLFieldView;
    },
    showField: function() {
      var id = this.id, fieldViewClass = this.getFieldViewClass();
      this.fieldView = new fieldViewClass({
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
      return this.base();
    }
  });
  Alpaca.registerFieldClass("dctmwurl", Alpaca.Fields.DctmwUrlField, "bootstrap-csui");
  Alpaca.registerFieldClass("dctmwurl", Alpaca.Fields.DctmwUrlField, "bootstrap-edit-horizontal");
  return $.alpaca.Fields.DctmwUrlField;
});