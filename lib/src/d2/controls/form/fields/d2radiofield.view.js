/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/controls/form/fields/dctmwradiofield.view", "i18n!d2/controls/form/impl/nls/lang" ], function(_, $, DctmwRadioFieldView, lang) {
  "use strict";
  return DctmwRadioFieldView.extend({
    constructor: function D2RadioFieldView() {
      DctmwRadioFieldView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      let helpers = DctmwRadioFieldView.prototype.templateHelpers.apply(this, arguments), items = this.collection.map(item => item.attributes), validationErrorMsg;
      _.each(items, function(item) {
        if (_.isString(item.category) && /Error/.test(item.category)) {
          item.class = "radio-item-error";
          if (!validationErrorMsg) {
            validationErrorMsg = lang.radioFieldValidationErrorInvalidValue;
          }
        }
      });
      helpers.validationErrorMsg = validationErrorMsg;
      return helpers;
    },
    dctmwGetCollectionData: function() {
      return _.zip(this.schema["enum"], this.options.optionLabels, _.pluck(this.options.enum, "category")).map(function(cur) {
        return {
          id: cur[0],
          name: cur[1],
          category: cur[2]
        };
      });
    },
    getEditValue: function() {
      if (this.$el.find("input:checked").length > 0) {
        var input = this.$el.find("input:checked").get(0).id;
        if (input && input !== "") {
          let selectedModel = this.collection.find(model => model.id.toString() === input), category = selectedModel.get("category"), erroneous = _.isString(category) && /Error/.test(category);
          if (erroneous) {
            this.$el.find(".validation-error-message").removeClass("binf-hidden");
          } else {
            this.$el.find(".validation-error-message").addClass("binf-hidden");
          }
          return selectedModel.id;
        }
      }
      return this.getValue().id;
    },
    _afterVisible: function() {
      var parentContainers = this.$el.parents(".dcmtw-container");
      _.some(parentContainers, function(el) {
        var $el = $(el);
        if ($el.hasClass("dcmtw-nested-fieldset-layout")) {
          this.$el.addClass("nested-fieldset-background");
          return true;
        } else if ($el.hasClass("d2tabgroupcontainer")) {
          return true;
        }
      }, this);
      this._setHeight();
    }
  });
});