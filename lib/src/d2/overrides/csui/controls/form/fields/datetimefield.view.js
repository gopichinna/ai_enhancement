/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/datetimefield.view", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "d2/utils/form.utils", "d2/utils/mass.update.utils", "dctmw/utils/utils", "nuc/utils/types/date", "d2/utils/types/inputdate", "nuc/lib/moment", "d2/utils/constants" ], function(DateTimeFieldView, MassUpdateFieldMixin, FormUtils, MassUpdateUtils, utils, date, inputDate, moment, constants) {
  "use strict";
  var originalConvertFromInputToModel = DateTimeFieldView.prototype._convertFromInputToModel;
  var originalConvertFromModelToInput = DateTimeFieldView.prototype._convertFromModelToInput;
  var originalTemplateHelpers = DateTimeFieldView.prototype.templateHelpers;
  DateTimeFieldView.prototype.setStateWrite = function(validate) {
    FormUtils.setStateWrite(this);
    if (this.model.get("options").massUpdateFileCount && !(this.childTKLViews.length || this.parentViews.length)) {
      this.setValue(this.curVal, validate);
    }
  };
  DateTimeFieldView.prototype._getPlaceHolder = function() {
    var options = this.model.get("options");
    var label = this.format.toLowerCase();
    options.placeholder = label;
    return label;
  };
  DateTimeFieldView.prototype._convertFromInputToModel = function(value) {
    if (this.model.get("options").hasMultipleValues && MassUpdateUtils.fieldHasMultipleValues(value)) {
      return value;
    } else {
      return originalConvertFromInputToModel.apply(this, arguments);
    }
  };
  DateTimeFieldView.prototype._convertFromModelToInput = function(value) {
    if (this.model.get("options").hasMultipleValues && MassUpdateUtils.fieldHasMultipleValues(value)) {
      return value;
    } else {
      return originalConvertFromModelToInput.apply(this, arguments);
    }
  };
  DateTimeFieldView.prototype.getEditValue = function() {
    var value = this.ui.writeField.val();
    var type = this.ui.writeField[0].type;
    if (value !== "" && type === "datetime-local" && utils.isMobile()) {
      value = date.formatExactDateTime(value);
      return DateTimeFieldView.prototype._convertFromInputToModel.call(this, value);
    }
    return this._convertFromInputToModelWrite(value);
  };
  DateTimeFieldView.prototype._convertFromInputToModelWrite = function(value) {
    return value ? date.serializeDateTime(value, this.format, function() {
      return false;
    }) : null;
  };
  DateTimeFieldView.prototype.templateHelpers = function() {
    var templateHelperValues = originalTemplateHelpers.call(this);
    var value = this.model.get("data");
    if (this.mode === "writeonly") {
      if (utils.isMobile()) {
        templateHelperValues.inputType = "datetime-local";
        templateHelperValues.data = templateHelperValues.data ? moment(value).format(constants.ISODateFormats.DATE_TIME_INPUT) : "";
      } else {
        !!value && (templateHelperValues.data = inputDate.formatExactDateTimeInput(value));
      }
      !!value && (templateHelperValues.readData = templateHelperValues.data);
    }
    return templateHelperValues;
  };
  MassUpdateFieldMixin.mixin(DateTimeFieldView.prototype);
});