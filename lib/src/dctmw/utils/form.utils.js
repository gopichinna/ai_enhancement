/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/lib/alpaca/js/alpaca.lite", "i18n", "nuc/utils/base" ], function(_, $, Alpaca, i18n, base) {
  "use strict";
  return {
    handleValidationForRequiredField: function(control, isValid) {
      var arrayValidations = control.validation;
      if (!isValid) {
        if (control.isRequired() && (control.type === "dctmwlabel" && !_.isEmpty(control.data) || control.type !== "dctmwlabel" && !control.options.disallowOnlyEmptySpaces && !_.isEmpty(control.fieldView.ui.writeField.val())) || control.type !== "dctmwlabel" && control.options.disallowOnlyEmptySpaces && !_.isEmpty($.trim(control.fieldView.ui.writeField.val())) || this.requiredFieldAddOnValidation(control, isValid)) {
          if (arrayValidations["notOptional"]) {
            arrayValidations["notOptional"]["status"] = true;
            arrayValidations["notOptional"]["message"] = "";
          }
        }
      }
      return isValid;
    },
    requiredFieldAddOnValidation: function() {
      return false;
    },
    _validateOptional: function(control) {
      if (control.isRequired() && (control.isEmpty() || _.isEmpty(control.fieldView.ui.writeField.val()) || control.options.disallowOnlyEmptySpaces && _.isEmpty($.trim(control.fieldView.ui.writeField.val())))) {
        return false;
      }
      return true;
    },
    buildKeyPathMap: function(formModel, baseKeyMap) {
      const fnContainerPredicate = type => [ "object", "array" ].includes(type), DELIMITER = ".", formSchema = formModel.get("schema"), formData = formModel.get("data");
      const formId = formModel.get("id") || formSchema.id;
      if (!formId) {
        throw new Error("form schema should have an id");
      }
      function getType(data) {
        let type = Alpaca.getSchemaType(data);
        if (!type) {
          if (data && Alpaca.isArray(data)) {
            type = "array";
          } else {
            type = "object";
          }
        }
        return type;
      }
      const keyPathMap = baseKeyMap || {};
      function _buildKeyPathFromSchema(schema, data, basePath) {
        if (schema) {
          let type = schema.type;
          if (!type) {
            type = getType(data);
          }
          const subSchema = type === "array" ? schema.items.properties : schema.properties;
          if (subSchema) {
            Object.entries(subSchema).forEach(([ fieldId, field ]) => {
              keyPathMap[fieldId] = {
                formId: formId,
                fieldPath: basePath + fieldId
              };
              if (fnContainerPredicate(field.type)) {
                let subData = data && data[fieldId], childBasePath = basePath + fieldId + DELIMITER;
                _buildKeyPathFromSchema(field, subData, childBasePath);
              }
            });
          }
        }
        return keyPathMap;
      }
      return _buildKeyPathFromSchema(formSchema, formData, "");
    },
    getAlpacaControlByPath: function(form, controlPath, delimiter) {
      delimiter = _.isUndefined(delimiter) ? "." : delimiter;
      return this.getFieldForPath(form, "childrenByPropertyId", delimiter, controlPath);
    },
    getFieldForPath: function(parentFldConfig, propertyName, delimeter, fldPath) {
      var control = _.reduce(fldPath.split(delimeter), function(parentControl, childCntrlId) {
        var childControl;
        if (parentControl) {
          childControl = parentControl[propertyName][childCntrlId];
        }
        return childControl;
      }, parentFldConfig);
      return control;
    },
    setStateWrite: function(control) {
      control.initialValue = control.getValue();
      if ($.fn.datetimepicker) {
        var that = control;
        control.ui.writeDateField.datetimepicker({
          format: control.format,
          keepInvalid: true,
          useStrict: true,
          widgetParent: control.$el,
          showClear: base.isTouchBrowser(),
          defaultDate: this._getPickerDefaultDate(control),
          widgetPositioning: {
            vertical: "auto",
            horizontal: i18n.settings.rtl ? "right" : "left"
          }
        }).on("dp.change", function(event) {
          $(event.target).parents(".csui-normal-scrolling").css("overflow", "auto");
        }).on("dp.place", function(event) {
          if (base.isMSBrowser() || base.isTouchBrowser() && i18n && i18n.settings.rtl) {
            var inputEle = $(event.target), dropDownContainer = that.$el.find(".binf-datetimepicker-widget");
            base.adjustDropDownField(inputEle, dropDownContainer, false, that, that.hideDateTimePicker);
            event.stopImmediatePropagation();
          }
        }).on("dp.show", function(event) {
          if (that.getEditableBehavior().hideActions) {
            that.options.isDropDownOpen = true;
            var scrollableCols = that.$el.closest(".csui-scrollable-writemode");
            if (!!scrollableCols && !scrollableCols.hasClass("csui-dropdown-open")) {
              scrollableCols.addClass("csui-dropdown-open");
            }
            that.getEditableBehavior().hideActions(event);
          }
          if (!base.isMSBrowser() || !(base.isTouchBrowser() && i18n && i18n.settings.rtl)) {
            var inputEle = $(event.target), dropDownContainer = that.$el.find(".binf-datetimepicker-widget");
            base.adjustDropDownField(inputEle, dropDownContainer, false, that, that.hideDateTimePicker);
          }
          event.stopImmediatePropagation();
        }).on("dp.hide", function(event) {
          if (that.getEditableBehavior().showActions) {
            that.options.isDropDownOpen = false;
            var scrollableCols = that.$el.closest(".csui-scrollable-writemode");
            if (!!scrollableCols && scrollableCols.hasClass("csui-dropdown-open")) {
              scrollableCols.removeClass("csui-dropdown-open");
            }
            that.getEditableBehavior().showActions(event);
          }
          event.stopImmediatePropagation();
          $(event.target).parents(".csui-normal-scrolling").css("overflow", "auto");
        });
      }
    },
    _getPickerDefaultDate: function(control) {
      return control.options && control.options.alpacaField && control.options.alpacaField.options && control.options.alpacaField.options.pickerDefaultDate;
    }
  };
});