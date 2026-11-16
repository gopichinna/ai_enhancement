/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/selectfield.view", "csui/utils/types/date", "i18n!csui/controls/form/impl/nls/lang", "csui/controls/form/fields/alpaca/alpcsuilabelfocusfield.mixin", "csui/lib/underscore.string" ], function(_, $, Backbone, Marionette, Alpaca, SelectFieldView, date, lang, AlpLabelFocusFieldMixin) {
  "use strict";
  var MAX_COUNT = 200;
  Alpaca.Fields.CsuiSelectField = Alpaca.Fields.SelectField.extend({
    constructor: function CsuiSelectField(container, data, options, schema, view, connector, onError) {
      this.excludeNoneOption = options.removeDefaultNone !== undefined && options.removeDefaultNone;
      this.base(container, data, options, schema, view, connector, onError);
      if (Array.isArray(this.schema.enum) && this.schema.type === "string" && this.schema.enum.length > MAX_COUNT) {
        this.schema.enumExtended = this.schema.enum.slice(MAX_COUNT);
        this.schema.enum = this.schema.enum.slice(0, MAX_COUNT);
      }
    },
    getFieldType: function() {
      return "select";
    },
    postRender: function(callback) {
      this.base(callback);
      this.showField();
      this.field.parent().addClass("csui-field-" + this.getFieldType());
      var labelEle = this.field && this.field.parent().find("label");
      this.wrapLabelTextNodeinSpan(labelEle);
    },
    onClickLabel: function(e) {
      e.stopPropagation();
      e.preventDefault();
      this.fieldView && this.fieldView.ui && this.fieldView.ui.readField.trigger(e.type);
    },
    showField: function() {
      var collectionData = [];
      var bNullValueFound = false;
      if (this.options.optionLabels) {
        collectionData = _.zip(this.schema["enum"], this.options.optionLabels).map(function(cur) {
          bNullValueFound = bNullValueFound || (cur[0] === null || cur[0] === "");
          return {
            id: cur[0],
            name: cur[1]
          };
        });
        ensureDateFormat(collectionData);
      } else if (Array.isArray(this.schema.enum)) {
        for (var i = 0; i < this.schema.enum.length; i++) {
          var cur = this.schema.enum[i];
          bNullValueFound = bNullValueFound || (cur[0] === null || cur[0] === "");
          collectionData.push({
            id: cur,
            name: cur
          });
        }
      } else if (this.options.dataSource) {
        collectionData = $.map(this.options.dataSource, function(value, index) {
          return {
            id: index,
            name: value
          };
        });
      }
      if (!bNullValueFound && !this.excludeNoneOption) {
        collectionData.splice(0, 0, {
          id: null,
          name: "<" + lang.selectFieldDefaultLabel + ">"
        });
      }
      var collection = new Backbone.Collection(collectionData), selection = {}, hasValue = true, isDataNotNaN = this.schema.type === "number" ? !isNaN(this.data) : true;
      if (this.data !== null && this.data !== "" && isDataNotNaN) {
        var name = !this.schema.enumExtended ? collection.get(this.data) && collection.get(this.data).get("name") : this.data;
        selection = new Backbone.Model({
          id: this.data,
          name: name
        });
      } else if (this.excludeNoneOption) {
        selection = new Backbone.Model({
          id: this.options.mode === "create" ? collection.models[0].attributes.id : null,
          name: collection.models[0].attributes.name
        });
        hasValue = this.options.mode === "create";
      } else {
        selection = new Backbone.Model({
          id: null,
          name: "<" + lang.selectFieldDefaultLabel + ">"
        });
      }
      var id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
      if (labelElement && labelElement.length == 1) {
        id4Label = labelElement.attr("for") + "Label";
        labelElement.attr("id", id4Label);
      }
      var id = this.id;
      this.fieldView = new SelectFieldView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
        id: _.uniqueId(id),
        alpacaField: this,
        labelId: id4Label,
        descriptionId: id4Description,
        selected: selection,
        collection: collection,
        mode: this.options.mode,
        path: this.path,
        dataId: this.name,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        },
        hasValue: hasValue
      });
      var $field = $("<div>").addClass("alpaca-control");
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({
        el: $field
      });
      this.region.show(this.fieldView);
    },
    setValueAndValidate: function(value, validate) {
      if (this.fieldView.mode !== "writeonly") {
        if (value instanceof Object) {
          if (value.id === null) {
            this.setValue(value.id);
          } else {
            this.setValue(value);
          }
        } else {
          this.setValue(value);
        }
      } else {
        this.setValue(value);
      }
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
      }
      this.refreshValidationState(false);
      return bIsValid;
    },
    _validator: function(callback) {
      var value = this.getValue();
      if (this.schema.required && value === "") {
        callback({
          status: false,
          message: "This field is required"
        });
      } else {
        callback({
          status: true
        });
      }
    },
    validate: function() {
      var ret = this.base();
      this.validation = _.omit(this.validation, "invalidValueOfEnum");
      return ret;
    },
    setValue: function(value) {
      value === null ? this.base("") : this.base(value);
    },
    getValue: function() {
      return this.base();
    },
    focus: function() {
      this.fieldView.setFocus();
    },
    destroy: function() {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    }
  });
  function ensureDateFormat(collectionData) {
    _.each(collectionData, function(item) {
      var value = item.id, formatted;
      if (typeof value === "string") {
        formatted = tryFormatServerIso(value);
        if (formatted) {
          item.name = formatted;
        } else {
          formatted = tryFormatServerDotNet(value);
          if (formatted) {
            item.name = formatted;
          }
        }
      }
    });
  }
  function tryFormatServerIso(value) {
    if (/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\dZ?$/.test(value)) {
      return date.formatExactDate(value);
    }
  }
  function tryFormatServerDotNet(value) {
    if (/^D\/\d\d\d\d\/\d+\/\d+:\d+:\d+:\d+$/.test(value)) {
      var parts = /^D\/(\d\d\d\d)\/(\d+)\/(\d+):(\d+):(\d+):(\d+)$/.exec(value), label = _.str.sformat("{0}-{1}-{2}T{3}:{4}:{5}", parts[1], padWithTwoDigits(parts[2]), padWithTwoDigits(parts[3]), padWithTwoDigits(parts[4]), padWithTwoDigits(parts[5]), padWithTwoDigits(parts[6]));
      return date.formatExactDate(label);
    }
    function padWithTwoDigits(number) {
      return _.str.lpad(number, 2, "0");
    }
  }
  AlpLabelFocusFieldMixin.mixin(Alpaca.Fields.CsuiSelectField.prototype);
  Alpaca.registerFieldClass("select", Alpaca.Fields.CsuiSelectField, "bootstrap-csui");
  return Alpaca.Fields.CsuiSelectField;
});