/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/moment", "csui/controls/form/fields/datefield.view", "nuc/utils/base", "nuc/utils/types/date", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "d2/utils/form.utils", "d2/utils/mass.update.utils", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/types/inputdate" ], function(moment, DateFieldView, base, date, MassUpdateFieldMixin, FormUtils, MassUpdateUtils, utils, constants, inputDate) {
  "use strict";
  var originalTemplateHelpers = DateFieldView.prototype.templateHelpers;
  var originalOnRender = DateFieldView.prototype.onRender;
  var originalConvertFromInputToModel = DateFieldView.prototype._convertFromInputToModel;
  DateFieldView.prototype.setStateWrite = function(validate) {
    FormUtils.setStateWrite(this);
    if (this.model.get("options").massUpdateFileCount && !(this.childTKLViews.length || this.parentViews.length)) {
      this.setValue(this.curVal, validate);
    }
  };
  DateFieldView.prototype._getPlaceHolder = function() {
    if (utils.isMobile()) {
      this.options.alpacaField.inputType = "date";
      return "";
    } else {
      var options = this.model.get("options");
      var label = this.format.toLowerCase();
      options.placeholder = label;
      return label;
    }
  };
  DateFieldView.prototype.templateHelpers = function() {
    var templateHelperValues = originalTemplateHelpers.call(this);
    var value = this.model.get("data");
    if (this.mode === "writeonly") {
      if (utils.isMobile()) {
        templateHelperValues.inputType = "date";
        templateHelperValues.data = templateHelperValues.data ? moment(value).format(constants.ISODateFormats.DATE_ONLY) : "";
      } else {
        !!value && (templateHelperValues.data = inputDate.formatExactDateInput(value));
      }
      !!value && (templateHelperValues.readData = templateHelperValues.data);
    }
    return templateHelperValues;
  };
  DateFieldView.prototype.getEditValue = function() {
    var value = this.ui.writeField.val();
    var type = this.ui.writeField[0].type;
    if (value !== "" && type === "date" && utils.isMobile()) {
      value = date.formatExactDate(value);
      return DateFieldView.prototype._convertFromInputToModel.call(this, value);
    }
    return this._convertFromInputToModelWrite(value);
  };
  DateFieldView.prototype.onRender = function() {
    if (utils.isMobile() && !base.isAppleMobile()) {
      var me = this;
      me.ui.writeField.on("input", function() {
        me.ui.writeField.trigger("focusout");
      });
    }
    originalOnRender && originalOnRender.apply(this, arguments);
  };
  DateFieldView.prototype._convertFromInputToModel = function(value) {
    if (this.model.get("options").hasMultipleValues && MassUpdateUtils.fieldHasMultipleValues(value)) {
      return value;
    } else {
      return originalConvertFromInputToModel.apply(this, arguments);
    }
  };
  DateFieldView.prototype._convertFromModelToInput = function(value) {
    if (this.model.get("options").hasMultipleValues && MassUpdateUtils.fieldHasMultipleValues(value)) {
      return value;
    } else {
      return value ? date.formatExactDate(date.deserializeDate(value)) : "";
    }
  };
  DateFieldView.prototype.enableDisableField = function(enabled) {
    if (enabled) {
      this.$el.find(".icon-date_picker").removeClass("cs-icon-disabled");
    } else {
      this.$el.find(".icon-date_picker").addClass("cs-icon-disabled");
    }
  };
  DateFieldView.prototype._convertFromInputToModelWrite = function(value) {
    return value ? date.serializeDate(value, this.format, function() {
      return false;
    }) : null;
  };
  MassUpdateFieldMixin.mixin(DateFieldView.prototype);
});