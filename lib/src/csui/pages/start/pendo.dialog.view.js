/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/utils/namedlocalstorage", "i18n!csui/pages/start/impl/nls/lang", "csui/utils/commands", "csui/utils/commandhelper", "hbs!csui/pages/start/impl/pendoDialog/pendoDialog", "css!csui/pages/start/impl/pendoDialog/pendoDialog" ], function(Marionette, NamedLocalStorage, lang, commands, CommandHelper, template) {
  var pendoBodyView = Marionette.ItemView.extend({
    template: template,
    namedLocalStorage: new NamedLocalStorage("pendoSettings"),
    className: "pendoDialog",
    ui: {
      pendoConfigLink: ".pendo-config-link",
      pendoCheckbox: "otc-checkbox.csui-pendo-checkbox"
    },
    events: {
      "click @ui.pendoConfigLink": "onClickLink",
      "change @ui.pendoCheckbox": "onChangeCheckbox"
    },
    constructor: function pendoBodyView(options) {
      Marionette.ItemView.apply(this, arguments);
      this.options = options;
    },
    templateHelpers: function() {
      return {
        pendoDialogMessage: lang.pendoDialogMessage,
        clickMessage: lang.clickMessage,
        doNotShowMessage: lang.checkBoxLabel
      };
    },
    onClickLink: function() {
      let command = commands.get("ContentServerAdministration");
      CommandHelper.handleExecutionResults(command.execute(this.options));
    },
    onChangeCheckbox: function(e) {
      this.namedLocalStorage.set("doNotShowAgain", e.target.checked);
    }
  });
  return pendoBodyView;
});