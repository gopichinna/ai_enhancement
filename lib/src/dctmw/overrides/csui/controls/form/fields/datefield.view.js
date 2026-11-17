/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/moment", "csui/controls/form/fields/datefield.view", "nuc/utils/base", "nuc/utils/types/date", "dctmw/utils/form.utils", "dctmw/utils/utils", "dctmw/utils/constants", "dctmw/utils/icons/dctmw.jato.action.icons", "dctmw/utils/types/inputdate", "hbs!dctmw/overrides/csui/controls/form/fields/impl/datefield/datefield", "i18n!csui/controls/form/impl/nls/lang", "css!dctmw/overrides/csui/controls/form/fields/impl/datefield/datefield" ], function(moment, DateFieldView, base, date, FormUtils, utils, constants, JatoActionIcons, inputDate, template, lang) {
  "use strict";
  var originalTemplateHelpers = DateFieldView.prototype.templateHelpers;
  var originalOnRender = DateFieldView.prototype.onRender;
  DateFieldView.prototype.template = template;
  DateFieldView.prototype.setStateWrite = function() {
    FormUtils.setStateWrite(this);
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
    templateHelperValues.datePickerIconSvg = JatoActionIcons.dctmw_actionDatePicker;
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
  DateFieldView.prototype._convertFromModelToInput = function(value) {
    return value ? date.formatExactDate(date.deserializeDate(value)) : "";
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
});