/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/datetimefield.view", "dctmw/utils/form.utils", "dctmw/utils/utils", "nuc/utils/types/date", "dctmw/utils/types/inputdate", "nuc/lib/moment", "dctmw/utils/constants", "dctmw/utils/icons/dctmw.jato.action.icons", "hbs!dctmw/overrides/csui/controls/form/fields/impl/datefield/datefield", "i18n!csui/controls/form/impl/nls/lang" ], function(DateTimeFieldView, FormUtils, utils, date, inputDate, moment, constants, JatoActionIcons, template, lang) {
  "use strict";
  var originalTemplateHelpers = DateTimeFieldView.prototype.templateHelpers;
  var originalOnRender = DateTimeFieldView.prototype.onRender;
  DateTimeFieldView.prototype.template = template;
  DateTimeFieldView.prototype.setStateWrite = function() {
    FormUtils.setStateWrite(this);
  };
  DateTimeFieldView.prototype._getPlaceHolder = function() {
    var options = this.model.get("options");
    var label = this.format.toLowerCase();
    options.placeholder = label;
    return label;
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
    templateHelperValues.datePickerIconSvg = JatoActionIcons.dctmw_actionDatePicker;
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
  DateTimeFieldView.prototype.onRender = function() {
    originalOnRender && originalOnRender.apply(this, arguments);
    if (this.mode === "writeonly" && this.options?.alpaca?.schema?.disabled) {
      let inputDate = this.$el.find(".binf-input-group.csui-datefield-input input"), inputDateWrapper = this.$el.find(".binf-input-group.csui-datefield-input"), inputDateStyle = inputDate.attr("style") || "", inputDateValue = inputDate.val(), title = inputDateValue || lang.noValue;
      inputDateStyle += ";text-overflow:ellipsis;";
      inputDate.attr("style", inputDateStyle);
      inputDateWrapper.attr("title", title);
    }
    this.listenTo(this, "disable:field", function() {
      _setOrRemoveToolTipOnField.call(this);
    });
  };
  function _setOrRemoveToolTipOnField() {
    let inputDateWrapper = this.$el.find(".binf-input-group.csui-datefield-input"), inputDate = this.$el.find(".binf-input-group.csui-datefield-input input"), inputDateStyle = inputDate.attr("style") || "";
    if (this.options?.alpaca?.schema?.disabled) {
      let inputDateValue = inputDate.val(), title = inputDateValue || lang.noValue;
      if (inputDateStyle.indexOf("text-overflow:ellipsis") === -1) {
        inputDateStyle += ";text-overflow:ellipsis;";
        inputDate.attr("style", inputDateStyle);
      }
      inputDateWrapper.attr("title", title);
    } else {
      if (inputDateStyle.indexOf("text-overflow:ellipsis") !== -1) {
        inputDateStyle.replace("text-overflow:ellipsis", "");
        inputDate.attr("style", inputDateStyle);
      }
      inputDateWrapper.removeAttr("title");
    }
  }
});