/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/form/impl/fields/csformfield.view", "hbs!csui/controls/form/impl/fields/passwordfield/passwordfield", "smart/themes/theming", "i18n!csui/controls/form/impl/fields/passwordfield/nls/lang", "css!csui/controls/form/impl/fields/passwordfield/passwordfield" ], function(_, $, Backbone, Marionette, FormFieldView, template, theming, lang) {
  "use strict";
  var PasswordFieldView = FormFieldView.extend({
    constructor: function PasswordFieldView(options) {
      FormFieldView.apply(this, arguments);
    },
    className: "cs-formfield cs-passwordfield",
    template: template,
    templateHelpers: function() {
      return _.extend(FormFieldView.prototype.templateHelpers.apply(this), {
        inputType: "password",
        title: lang.title,
        idBtnDescription: this.options.descriptionId,
        isJATO: theming.isJATOTheme()
      });
    }
  });
  return PasswordFieldView;
});