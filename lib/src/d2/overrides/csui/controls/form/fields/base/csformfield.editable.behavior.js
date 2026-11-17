/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/base/csformfield.editable.behavior", "d2/utils/mass.update.utils", "i18n!csui/controls/form/impl/nls/lang", "dctmw/controls/form/fields/base/csformfield.editable.behavior" ], function(_, $, FormFieldEditable2Behavior, MassUpdateUtils, lang) {
  "use strict";
  const prototype = FormFieldEditable2Behavior.prototype, oDisableField = prototype.disableField, oDctmwGetDisableFieldCss = prototype.dctmwGetDisableFieldCss, oDctmwCanToggleSwitchState = prototype.dctmwCanToggleSwitchState;
  _.extend(prototype, {
    dctmwGetDisableFieldCss: function() {
      return oDctmwGetDisableFieldCss.call(this) + " d2-field-disabled";
    },
    disableField: function() {
      if (this.view && this.view.alpacaField && this.view.alpacaField.schema) {
        if (this.view.alpacaField.schema.disabled) {
          if (this.view.ui.writeField) {
            if (!(this.view.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.view.alpacaField.getValue()))) {
              this.view.ui.writeField.attr("placeholder", lang.noValueSet);
              this.view.alpacaField.domEl.find(".binf-help-block.alpaca-message")?.remove();
              this.view.alpacaField.domEl.find(".alpaca-invalid")?.removeClass("alpaca-invalid");
              this.view.alpacaField.domEl.find(".cs-formfield-invalid")?.removeClass("cs-formfield-invalid");
              this.view.alpacaField.domEl.find(".binf-has-error")?.removeClass("binf-has-error");
            }
          }
        } else {
          if (this.view.ui.writeField) {
            if (!(this.view.alpacaField.options.massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.view.alpacaField.getValue()))) {
              this.view._getPlaceHolder && this.view.ui.writeField.attr("placeholder", this.view._getPlaceHolder());
            }
          }
        }
      }
      oDisableField.apply(this, arguments);
    },
    dctmwCanToggleSwitchState: function() {
      return oDctmwCanToggleSwitchState.apply(this, arguments) || this.view.alpacaField.options.type === "d2massupdateboolean";
    },
    dctmwCanToggleFieldState: function() {
      return [ "date", "d2list", "d2combo", "d2userlist", "d2usercombo", "d2nodepicker", "richtext" ].includes(this.view.alpacaField.options.type);
    }
  });
});