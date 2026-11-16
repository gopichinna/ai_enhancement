/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/textfield.view", "i18n!csui/controls/form/impl/nls/lang", "i18n!d2/utils/impl/nls/lang", "hbs!d2/controls/form/impl/d2password/d2passwordfield", "css!d2/controls/form/impl/d2password/d2passwordfield", "csui/lib/binf/js/binf", "nuc/lib/handlebars.helpers.xif" ], function(_, $, Backbone, Marionette, TextFieldView, lang, MassUpdateLang, template) {
  "use strict";
  var PasswordFieldView = TextFieldView.extend({
    constructor: function PasswordFieldView() {
      TextFieldView.apply(this, arguments);
      var me = this;
      this.listenTo(this, "show", function() {
        me.showOrHidePasswordIcon();
      });
    },
    getDisplayValue: function() {
      return this.getEditValue();
    },
    className: "cs-formfield cs-passwordfield",
    template: template,
    ui: {
      writeArea: ".cs-field-write",
      writeField: ".cs-field-write input",
      readArea: ".cs-field-read",
      readField: ".cs-field-read button",
      showHideToggleIcon: ".d2-icon-password-icon"
    },
    events: {
      "click @ui.showHideToggleIcon": "onTogglePasswordVisble",
      "mouseup @ui.writeField": "showOrHidePasswordIcon",
      "keyup @ui.writeField": "showOrHidePasswordIcon",
      "keydown @ui.showHideToggleIcon": "onTogglePasswordVisble"
    },
    templateHelpers: function() {
      return _.extend(TextFieldView.prototype.templateHelpers.apply(this), {
        inputType: "password",
        idBtnLabel: this.options.labelId,
        writeonlyMode: this.mode === "writeonly",
        showOrHidePassword: this.options.alpaca && this.options.alpaca.options.showOrHidePassword
      });
    },
    allowEditOnEnter: function() {
      return true;
    },
    allowEditOnClickReadArea: function() {
      return true;
    },
    getEditValue: function() {
      var val = this.ui.writeField.val(), model = this.options.model || this.model;
      if (model.get("options").massUpdateFileCount && _.isEmpty(val) && this.showMultiplePlaceholder) {
        val = this.ui.writeField.attr("placeholder");
      }
      return val;
    },
    onTogglePasswordVisble: function() {
      if (this.ui.showHideToggleIcon.hasClass("d2-icon-password-icon-hide")) {
        this.ui.writeField.attr("type", "password");
      } else {
        this.ui.writeField.attr("type", "text");
      }
      this.ui.showHideToggleIcon.toggleClass("d2-icon-password-icon-hide");
    },
    showOrHidePasswordIcon: function() {
      if (this.ui.writeField.val() === "") {
        this.ui.showHideToggleIcon.hide();
        this.ui.showHideToggleIcon.attr("tabindex", -1);
      } else {
        this.ui.showHideToggleIcon.show();
        this.ui.showHideToggleIcon.attr("tabindex", 0);
      }
    }
  });
  return PasswordFieldView;
});