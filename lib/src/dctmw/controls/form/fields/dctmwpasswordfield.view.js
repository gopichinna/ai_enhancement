/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/textfield.view", "hbs!dctmw/controls/form/impl/dctmwpassword/dctmwpasswordfield", "css!dctmw/controls/form/impl/dctmwpassword/dctmwpasswordfield", "csui/lib/binf/js/binf", "nuc/lib/handlebars.helpers.xif" ], function(_, TextFieldView, template) {
  "use strict";
  var DctmwPasswordFieldView = TextFieldView.extend({
    constructor: function DctmwPasswordFieldView() {
      TextFieldView.apply(this, arguments);
      var me = this;
      this.listenTo(this, "show", function() {
        me.showOrHidePasswordIcon();
      });
    },
    getDisplayValue: function() {
      return this.getEditValue();
    },
    className: "cs-formfield cs-passwordfield dctmw-passwordfield",
    template: template,
    ui: {
      writeArea: ".cs-field-write",
      writeField: ".cs-field-write input",
      readArea: ".cs-field-read",
      readField: ".cs-field-read button",
      showHideToggleIcon: ".dctmw-icon-password-icon"
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
      return this.ui.writeField.val();
    },
    onTogglePasswordVisble: function() {
      if (this.ui.showHideToggleIcon.hasClass("dctmw-icon-password-icon-hide")) {
        this.ui.writeField.attr("type", "password");
      } else {
        this.ui.writeField.attr("type", "text");
      }
      this.ui.showHideToggleIcon.toggleClass("dctmw-icon-password-icon-hide");
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
  return DctmwPasswordFieldView;
});