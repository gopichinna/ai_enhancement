/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/textfield.view", "i18n!csui/controls/form/impl/nls/lang", "i18n!d2/controls/form/impl/nls/lang" ], function(_, $, Backbone, Marionette, TextFieldView, lang, D2FormsLang) {
  "use strict";
  var LabelFieldView = TextFieldView.extend({
    constructor: function LabelFieldView(options) {
      TextFieldView.prototype.constructor.call(this, options);
    },
    templateHelpers: function() {
      var templateHelper = TextFieldView.prototype.templateHelpers.apply(this);
      var label = this.model.get("schema").mapping_value;
      if (label) {
        if (this.isDateField(label) && this.model.has("data")) {
          label = this.model.get("data");
        }
        var isRequired = this.options.alpacaField && this.options.alpacaField.isRequired(), requiredTxt = isRequired ? lang.requiredField : "";
        templateHelper.data = label;
        templateHelper.tooltip = label;
        if (this.model.get("options")) {
          templateHelper.readModeAria = _.str.sformat(lang.fieldReadOnlyAria, this.model.get("options").label, label) + requiredTxt;
        }
      }
      var modelOptions = this.model.get("options");
      if (modelOptions && modelOptions._repeating) {
        var modelData = this.model.get("data");
        if (_.isArray(modelData)) {
          if (modelData.length) {
            templateHelper.repeatingLabelData = this.formatRepeatingLabelData(modelData);
            templateHelper.readModeAria = _.str.sformat(lang.fieldReadOnlyAria, this.model.get("options").label, templateHelper.repeatingLabelData);
            templateHelper.tooltip = templateHelper.repeatingLabelData;
          } else {
            templateHelper.hasData = false;
            templateHelper.readModeAria = _.str.sformat(lang.fieldReadOnlyAria, this.model.get("options").label, lang.noValue);
          }
        }
      }
      if (!templateHelper.hasData) {
        templateHelper.tooltip = templateHelper.emptyLabel;
        templateHelper.noValue = templateHelper.emptyLabel;
      }
      return templateHelper;
    },
    formatRepeatingLabelData: function(data) {
      var value = "";
      _.each(data, function(item, index) {
        value = index === 0 ? item : _.str.sformat(D2FormsLang.repeatingLabelSeperator, value, item);
      });
      return value;
    },
    isDateField: function(text) {
      if (this.alpacaField && this.alpacaField.options && this.alpacaField.options._type && (this.alpacaField.options._type === "date" || this.alpacaField.options._type === "datetime")) {
        var length = text.length;
        if (length > 19) {
          if (text.charAt(length - 1) === "Z") {
            return true;
          }
          var direction = text.charAt(length - 5);
          if (direction === "+" || direction === "-") {
            return true;
          }
        }
      }
      return false;
    }
  });
  return LabelFieldView;
});