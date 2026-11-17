/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/base/csformfield.editable.behavior" ], function(_, $, FormFieldEditable2Behavior) {
  "use strict";
  const prototype = FormFieldEditable2Behavior.prototype, oldOnChangeWriteField = prototype.onChangeWriteField, oldOnFocusOutWrite = prototype.onFocusOutWrite, oldTrySetValue = prototype.trySetValue;
  _.extend(prototype, {
    events: _.extend(prototype.events, {
      keyup: "onKeyUp",
      "dp.change": "onKeyUp",
      input: "onInput"
    }),
    onKeyUp: _.throttle(function(event) {
      var val = this.ui.writeField && this.ui.writeField.val();
      this.$el.trigger($.Event("field:keyup", {
        keyCode: event.keyCode
      }), {
        val: val,
        control: this.view.alpacaField
      });
    }, 100),
    onFocusOutWrite: function(event) {
      if (this.view.validateFocusOutWithinView) {
        if (this.view.$el.has(event.relatedTarget).length === 0) {
          oldOnFocusOutWrite.apply(this, arguments);
        }
      } else {
        oldOnFocusOutWrite.apply(this, arguments);
      }
    },
    trySetValue: function() {
      let isValid = oldTrySetValue.apply(this, arguments);
      if (!isValid) {
        const isPreValInvalid = this.view.$el.hasClass("cs-formfield-invalid"), silentOption = isPreValInvalid ? {
          silent: true
        } : {
          silent: false
        };
        this.view.model.set("data", this.view.getEditValue(), silentOption);
        if (isPreValInvalid) {
          this.view.model.trigger("change");
        }
      }
      return isValid;
    },
    onChangeWriteField: function() {
      oldOnChangeWriteField.apply(this, arguments);
      var val = this.ui.writeField && this.ui.writeField.val();
      this.$el.trigger($.Event("field:keydown"), {
        val: val,
        field: this.view.alpacaField
      });
    },
    disableField: function() {
      if (this.view && this.view.alpacaField && this.view.alpacaField.schema) {
        if (this.view.alpacaField.schema.disabled) {
          if (this.view.ui.writeField) {
            this.view.ui.writeField.attr("disabled", true);
            if (this.dctmwCanToggleFieldState()) {
              this.view.enableDisableField(false);
            }
            this.view.ui.writeField.attr("readonly", true);
            this.view.ui.writeField.attr("aria-disabled", true);
            this.view.ui.writeField.addClass("csui-formfield-disabled");
            this.view.$el.find(".cs-field-write").addClass("dctmw-field-disabled");
          } else if (this.view.ui.flagWriteField) {
            if (this.dctmwCanToggleSwitchState()) {
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
            this.view.$el.find(".cs-field-write").removeClass("dctmw-field-disabled");
            if (this.dctmwCanToggleFieldState()) {
              this.view.enableDisableField(true);
            }
          } else if (this.view.ui.flagWriteField) {
            if (this.dctmwCanToggleSwitchState()) {
              this.view.ui.flagWriteField.data("binfSwitch").disabled(false);
              this.view.nextSwitch && this.view.nextSwitch.data("binfSwitch").disabled(false);
            }
          }
        }
      }
    },
    dctmwGetDisableFieldCss: function() {
      return "dctmw-field-disabled";
    },
    dctmwCanToggleSwitchState: function() {
      return this.view.alpacaField.options.type === "checkbox" && this.view.alpacaField.options._type === "boolean";
    },
    dctmwCanToggleFieldState: function() {
      return [ "dctmwlist", "dctmwcombo" ].includes(this.view.alpacaField.options.type);
    },
    onInput: function(event) {
      var keypressDisabled = _.isFunction(this?.view?.alpacaField?.ignoreInputEvent) ? this?.view?.alpacaField?.ignoreInputEvent() : false;
      if (!keypressDisabled) this.onFocusOutWrite(event);
      return;
    }
  });
});