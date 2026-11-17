/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/controls/form/fields/dctmwcheckboxfield.view", "i18n!d2/controls/form/impl/nls/lang" ], function(_, $, DctmwCheckboxField, lang) {
  "use strict";
  let D2CheckboxFieldView = DctmwCheckboxField.extend({
    constructor: function D2CheckboxFieldView() {
      DctmwCheckboxField.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      const helpers = DctmwCheckboxField.prototype.templateHelpers.apply(this, arguments), items = this.collection.map(function(item) {
        return item.attributes;
      });
      let validationErrorMsg;
      _.each(items, function(item) {
        if (_.isString(item.category) && /Error/.test(item.category)) {
          item.clazz = "cb-item-error";
          if (!validationErrorMsg) {
            validationErrorMsg = lang.checkboxFieldValidationErrorInvalidValues;
          }
        }
      });
      helpers.validationErrorMsg = validationErrorMsg;
      return helpers;
    },
    getEditValue: function() {
      var data = [];
      var inputs = this.$el.find("input.checkbox-item:checked");
      var that = this, erroneous = false;
      inputs.each(function() {
        var id = $(this).attr("value");
        if (id && id !== "") {
          var selectedModel = that.collection.findWhere(function(model) {
            var mId = model.get("id") + "";
            return mId === id;
          });
          if (selectedModel) {
            data.push(selectedModel.get("id"));
            var category = selectedModel.get("category");
            if (!erroneous) {
              erroneous = _.isString(category) && /Error/.test(category);
            }
          }
        }
      });
      if (erroneous) {
        this.$el.find(".validation-error-message").removeClass("binf-hidden");
      } else {
        this.$el.find(".validation-error-message").addClass("binf-hidden");
      }
      this.curVal.splice(0, this.curVal.length);
      _.each(data, function(d) {
        this.curVal.push(d);
      }, this);
      return this.curVal;
    },
    _afterVisible: function() {
      var parentContainers = this.$el.parents(".dctmw-container");
      _.some(parentContainers, function(el) {
        var $el = $(el);
        if ($el.hasClass("dctmw-nested-fieldset-layout")) {
          this.$el.addClass("nested-fieldset-background");
          return true;
        } else if ($el.hasClass("d2tabgroupcontainer")) {
          return true;
        }
      }, this);
      this._setHeight();
    },
    dctmwCheckboxDataConverter: function(data) {
      return {
        id: data.value,
        name: data.text,
        category: data.category
      };
    }
  });
  return D2CheckboxFieldView;
});