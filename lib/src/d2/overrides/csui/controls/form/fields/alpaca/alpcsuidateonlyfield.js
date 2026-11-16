/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/alpaca/alpcsuidateonlyfield", "nuc/utils/types/date", "d2/utils/form.utils", "d2/utils/mass.update.utils", "dctmw/utils/utils", "csui/controls/form/fields/datefield.view", "d2/utils/types/inputdate", "d2/utils/constants" ], function(_, $, Backbone, Marionette, CsuiDateField, date, FormUtils, MassUpdateUtils, utils, DateFieldView, inputDate, constants) {
  var prototype = CsuiDateField.prototype;
  var origOnShow = prototype.onShow;
  var originalSetValue = prototype.setValue;
  var originalGetValue = prototype.getValue;
  var oldIsRequired = prototype.isRequired;
  var oldIsValidationParticipant = prototype.isValidationParticipant;
  prototype._validateOptional = function() {
    return FormUtils._validateOptional(this);
  };
  prototype._validateDateFormat = function() {
    if (this.options.hasMultipleValues) {
      return MassUpdateUtils.fieldHasMultipleValues(this.getValue()) || this._validateDateCustomFormat.call(this);
    } else {
      return this._validateDateCustomFormat.call(this);
    }
  };
  prototype.onShow = function() {
    var isReadDateFieldForMobile = utils.isMobile() && this.fieldView.options.alpaca.schema.readonly;
    if (isReadDateFieldForMobile) {
      this.fieldView.ui.writeArea.removeClass("binf-hidden");
      this.fieldView.ui.readArea.addClass("binf-hidden");
      this.fieldView.ui.writeArea.find("input").attr("disabled", true);
    } else {
      origOnShow.apply(this, arguments);
    }
  };
  prototype.setValue = function(value) {
    value = value === null ? "" : value;
    return originalSetValue.call(this, value);
  };
  prototype.getValue = function() {
    var value = originalGetValue.apply(this, arguments);
    value = value === null ? "" : value;
    return value;
  };
  prototype.isValidationParticipant = function() {
    var result = oldIsValidationParticipant.apply(this, arguments);
    return result && !this.schema.disabled;
  };
  prototype.isRequired = function() {
    var result = oldIsRequired.apply(this, arguments);
    return result && !this.schema.disabled;
  };
  prototype.showField = function() {
    var id = this.id;
    var id4Label, id4Description = this.options ? this.options.descriptionId : "", labelElement = $(this.field[0]).find("label");
    if (labelElement && labelElement.length == 1) {
      id4Label = labelElement.attr("for") + "Label";
      labelElement.attr("id", id4Label);
    }
    this.fieldView = new DateFieldView({
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
    if (this.fieldView.mode === "writeonly") {
      this.fieldView.format = inputDate.exactDateInputFormat;
    }
    var $field = $("<div>").addClass("alpaca-control");
    this.getControlEl().replaceWith($field);
    this.region = new Marionette.Region({
      el: $field
    });
    this.region.show(this.fieldView);
  };
  prototype._validateDateCustomFormat = function() {
    var parseFormat = inputDate.exactDateInputFormat;
    if (utils.isMobile()) {
      parseFormat = constants.ISODateFormats.DATE_ONLY;
    }
    var value = this.containerItemEl.find("input").val();
    if (!value && this.isRequired()) return false;
    if (!this.validateDateRange()) return false;
    return !value || date.validateDate(value, parseFormat);
  };
});