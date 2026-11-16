/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/types/date", "csui/controls/form/form.view", "d2/utils/format.utils", "i18n!d2/controls/facet.panel/impl/nls/lang", "hbs!d2/controls/facet.panel/impl/facet/facet.date.item", "css!d2/controls/facet.panel/impl/facet/facet.item" ], function($, _, Marionette, dateFormat, FormView, formatUtils, lang, template) {
  var FacetDateItemView = Marionette.ItemView.extend({
    template: template,
    className: "d2-facet-item",
    constructor: function FacetDateItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    ui: {
      dateControl: ".d2-facet-date-control"
    },
    events: {
      "keydown > input": "onKeyInView"
    },
    onRender: function() {
      var me = this;
      var id = this.model.get("id");
      this.$el.attr("id", id);
      var val = this.model.get("checked") === true ? this.model.get("facet-value") : "";
      this.$dateField = this.ui.dateControl.alpaca({
        data: {
          date_field: val
        },
        options: {
          fields: {
            date_field: {
              _type: "date",
              _repeating: false,
              type: "date",
              dateFormat: "MM/DD/YYYY",
              picker: {
                format: "MM/DD/YYYY"
              },
              mode: "create",
              labelModifed: true,
              readonly: false,
              setRequiredFieldsEditable: true,
              view: this,
              validator: function(callback) {
                var validator = me.model.get("validator");
                if (_.isFunction(validator)) {
                  var result = validator.apply(this);
                  callback({
                    status: result.status,
                    message: result.message
                  });
                } else {
                  callback({
                    status: true
                  });
                }
              }
            }
          }
        },
        schema: {
          properties: {
            date_field: {
              format: "date",
              readonly: false,
              title: this.model.get("name"),
              type: "string"
            }
          }
        },
        connector: {
          id: "default",
          config: {
            formView: new FormView({})
          }
        }
      });
      this.$dateField.on("field:changed", _.bind(this.onDateFieldChange, this));
      this.$dateField.off("keydown").on("keydown", this.onKeyInView);
    },
    onDateFieldChange: function(event) {
      var newValue = event.fieldvalue;
      event.fieldView.alpacaField.refreshValidationState(false, function() {
        var isValid = event.fieldView.alpacaField.isValid();
        if (isValid) {
          if (!_.isEmpty(newValue)) {
            this.model.set("checked", true);
            this.model.set("facet-value", newValue);
            this.trigger("multi:filter:select", this);
          } else {
            this.model.set("facet-value", "");
            this.model.set("checked", false);
            this.trigger("multi:filter:unselect", this);
          }
        }
      }.bind(this));
    },
    getIndex: function() {
      return this._index;
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, returnVal = true;
      switch (keyCode) {
       case 9:
        if (event.shiftKey) {
          if ($(event.target).hasClass("icon-date_picker")) {
            $(this).find("input").trigger("focus");
            returnVal = false;
          }
        } else {
          if (event.target === $(this).find("input")[0]) {
            $(this).find(".icon-date_picker").trigger("focus");
            returnVal = false;
          }
        }
        break;

       default:
        returnVal = true;
      }
      return returnVal;
    }
  });
  return FacetDateItemView;
});