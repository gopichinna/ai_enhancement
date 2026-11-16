/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/jquery", "csui/lib/marionette", "csui/models/form", "csui/behaviors/default.action/default.action.behavior" ], function(_, Backbone, $, Marionette, FormModel) {
  const FormViewV2 = Marionette.ItemView.extend({
    template: false,
    tagName: "otc-form",
    attributes: function() {
      let schema = {};
      if (this.model instanceof FormModel) {
        schema = {
          data: this.model.get("data"),
          schema: this.model.get("schema"),
          options: this.model.get("options")
        };
      }
      return {
        mode: this.mode,
        schema: JSON.stringify(schema),
        columns: this.columns
      };
    },
    constructor: function FormViewV2(options) {
      this.options = _.extend({}, options);
      this.mode = options.mode || {};
      this.columns = options.columns || undefined;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "reset", this.render);
    },
    render: function() {
      return this;
    },
    getData: function() {
      return this.el.data;
    },
    validate: function() {
      return this.el.validate();
    }
  });
  FormViewV2.version = "1.0";
  return FormViewV2;
});