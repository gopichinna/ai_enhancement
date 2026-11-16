/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/booleanfield.view" ], function(_, $, BooleanFieldView) {
  BooleanFieldView.prototype.onRender = function() {
    var checked = !this.model.get("data");
    this.ui.flagWriteField[0].checked = !checked;
    var isFieldDisabled = this.alpacaField && this.alpacaField.schema && this.alpacaField.schema.disabled || this.model && this.model.get("schema") && this.model.get("schema").disabled;
    this.ui.flagWriteField.binfSwitch({
      state: checked,
      size: "mini",
      onText: "&nbsp;",
      offText: "&nbsp;",
      labelText: "&nbsp;",
      disabled: isFieldDisabled ? true : false,
      readonly: this.mode === "readonly",
      isValidChange: _.bind(function() {
        if (this.mode !== "writeonly" && document.querySelectorAll(".binf-has-error").length > 0) {
          var errorElement = $($(document.querySelectorAll(".binf-has-error")).find(":input")[0]);
          var errorElementParent = errorElement.parents(".cs-form-set.cs-form-set-container");
          var targetElementParent = this.$el.parents(".cs-form-set.cs-form-set-container");
          if (!errorElementParent.is(targetElementParent)) {
            errorElement.trigger("focus");
            return false;
          }
        }
        return !this.model.get("schema").disabledBySelf;
      }, this),
      onBeforeChange: _.bind(this.options.onBeforeChange || this._onBeforeChange, this),
      onSwitchChange: _.bind(function(event, state) {
        this.$el.find(".binf-switch-wrapper").addClass("binf-switch-disabled");
        if (this.checkErrorExists()) {
          return false;
        }
        if (!!this.model.get("options") && !!this.model.get("options").isMultiFieldItem) {
          if (this.model.get("options").mode !== "create") {
            if (this.getEditValue() === this.getValue()) {
              this.$el.find(".cs-field-write").addClass("csui-unedited");
            } else {
              this.$el.find(".cs-field-write").removeClass("csui-unedited");
            }
            $(this.ui.readArea).trigger("click");
          } else {
            this.setValue(!state, true);
          }
          this.showApplyAll(event, true);
        } else {
          this.showApplyAll(event, false);
          this.setValue(!state, true);
        }
        this.$el.find(".binf-switch-wrapper").removeClass("binf-switch-disabled");
        this.ui.flagWriteField.trigger("focus");
        this.ui.flagWriteField.attr("aria-checked", !state);
        this.ui.flagWriteField[0].checked = !state;
      }, this)
    });
  };
});