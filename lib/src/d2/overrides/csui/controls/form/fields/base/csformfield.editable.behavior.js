/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/base/csformfield.editable.behavior", "d2/utils/mass.update.utils", "i18n!csui/controls/form/impl/nls/lang" ], function(_, $, FormFieldEditable2Behavior, MassUpdateUtils, lang) {
  "use strict";
  var prototype = FormFieldEditable2Behavior.prototype;
  var oldOnChangeWriteField = prototype.onChangeWriteField;
  var oldOnFocusOutWrite = prototype.onFocusOutWrite;
  prototype.onFocusOutWrite = function(event) {
    if (this.view.validateFocusOutWithinView) {
      if (this.view.$el.has(event.relatedTarget).length === 0) {
        oldOnFocusOutWrite.apply(this, arguments);
      }
    } else {
      oldOnFocusOutWrite.apply(this, arguments);
    }
  };
  prototype.onChangeWriteField = function() {
    oldOnChangeWriteField.apply(this, arguments);
    var val = this.ui.writeField && this.ui.writeField.val();
    this.$el.trigger($.Event("field:keydown"), {
      val: val,
      field: this.view.alpacaField
    });
  };
  prototype.disableField = function() {
    if (this.view && this.view.alpacaField && this.view.alpacaField.schema) {
      if (this.view.alpacaField.schema.disabled) {
        if (this.view.ui.writeField) {
          this.view.ui.writeField.attr("disabled", true);
          if (this.view.alpacaField.options.type === "d2list" || this.view.alpacaField.options.type === "d2userlist" || this.view.alpacaField.options.type === "d2combo" || this.view.alpacaField.options.type === "d2usercombo" || this.view.alpacaField.options.type === "d2nodepicker" || this.view.alpacaField.options.type === "date") {
            this.view.enableDisableField(false);
          }
          this.view.ui.writeField.attr("readonly", true);
          this.view.ui.writeField.attr("aria-disabled", true);
          this.view.ui.writeField.addClass("csui-formfield-disabled");
          this.view.$el.find(".cs-field-write").addClass("d2-field-disabled");
          if (!(this.view.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.view.alpacaField.getValue()))) {
            this.view.ui.writeField.attr("placeholder", lang.noValueSet);
          }
        } else if (this.view.ui.flagWriteField) {
          if (this.view.alpacaField.options.type === "checkbox" && this.view.alpacaField.options._type === "boolean" || this.view.alpacaField.options.type === "d2massupdateboolean") {
            this.view.ui.flagWriteField.data("binfSwitch").disabled(true);
            this.view.nextSwitch && this.view.nextSwitch.data("binfSwitch").disabled(true);
          }
        }
      } else {
        if (this.view.ui.writeField) {
          this.view.ui.writeField.prop("disabled", false);
          this.view.ui.writeField.attr("readonly", false);
          this.view.ui.writeField.attr("aria-disabled", false);
          this.view.ui.writeField.removeClass("csui-formfield-disabled");
          this.view.$el.find(".cs-field-write").removeClass("d2-field-disabled");
          if (!(this.view.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.view.alpacaField.getValue()))) {
            this.view._getPlaceHolder && this.view.ui.writeField.attr("placeholder", this.view._getPlaceHolder());
          }
          if (this.view.alpacaField.options.type === "d2list" || this.view.alpacaField.options.type === "d2userlist" || this.view.alpacaField.options.type === "d2combo" || this.view.alpacaField.options.type === "d2usercombo" || this.view.alpacaField.options.type === "d2nodepicker" || this.view.alpacaField.options.type === "date") {
            this.view.enableDisableField(true);
          }
        } else if (this.view.ui.flagWriteField) {
          if (this.view.alpacaField.options.type === "checkbox" && this.view.alpacaField.options._type === "boolean" || this.view.alpacaField.options.type === "d2massupdateboolean") {
            this.view.ui.flagWriteField.data("binfSwitch").disabled(false);
            this.view.nextSwitch && this.view.nextSwitch.data("binfSwitch").disabled(false);
          }
        }
      }
    }
  };
  prototype.events = _.extend(prototype.events, {
    keyup: "onKeyUp",
    "dp.change": "onKeyUp"
  });
  prototype.onKeyUp = _.throttle(function(event) {
    var val = this.ui.writeField && this.ui.writeField.val();
    this.$el.trigger($.Event("field:keyup", {
      keyCode: event.keyCode
    }), {
      val: val,
      control: this.view.alpacaField
    });
  }, 100);
});