/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/perspective.command", "smart/dialogs/modal.alert/modal.alert", "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, PerspectiveCommand, alertDialog, Url, lang) {
  "use strict";
  const PerspectiveDefaultCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveSetAsDefault"
    },
    enabled: function(options) {
      return !options?.options?.view.model.get("default");
    },
    execute: async function(status, options) {
      try {
        const result = await alertDialog.confirmQuestion(lang.defaultPerspectiveDialogMessage.replace("{0}", options.eventData.view.model.get("title")), lang.setDefaultPerspectiveLabel, {
          buttons: {
            showYes: true,
            labelYes: lang.confirmButtonLabel,
            showNo: false,
            showCancel: true,
            labelCancel: lang.editPageCancelButton
          }
        });
        result && this.executeDefault(options);
      } catch (error) {}
    },
    executeDefault: async function(options) {
      const currentView = options.eventData.view;
      const id = currentView.model.getPerspectiveId();
      const connector = currentView.options.originatingView.connector;
      const fullUrl = Url.combine(connector.getConnectionUrl().getApiBase("v2"), `/perspectives/preference`);
      const formData = new FormData();
      formData.append("preference", JSON.stringify({
        perspective_id: id
      }));
      const executeOptions = {
        type: "POST",
        url: fullUrl,
        data: formData
      };
      let resp;
      const GlobalMessage = await require("csui/controls/globalmessage/globalmessage");
      try {
        resp = await connector.makeAjaxCall(executeOptions);
        const prevDefaultModel = currentView.model.collection.findWhere({
          default: true
        });
        prevDefaultModel?.set("default", false);
        currentView.model.set("default", true);
        GlobalMessage.showMessage("success", lang.defaultPerspectiveSuccessMessage.replace("{0}", currentView.model.getTitle()));
      } catch (error) {
        let errorMessage;
        if (error?.responseJSON?.error) {
          errorMessage = error.responseJSON.error;
        } else {
          errorMessage = lang.defaultPerspectiveFailMessage.replace("{0}", currentView.model.getTitle());
        }
        GlobalMessage.showMessage("error", errorMessage);
      }
    }
  });
  return PerspectiveDefaultCommand;
});