/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/models/perspective.command", "csui/utils/url", "smart/dialogs/modal.alert/modal.alert", "smart/controls/globalmessage/globalmessage", "i18n!csui/utils/commands/nls/localized.strings" ], function(_, PerspectiveCommand, Url, alertDialog, GlobalMessage, lang) {
  "use strict";
  const PerspectiveDeleteCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveDelete"
    },
    enabled: function(status) {
      return !status.options?.view?.model.get("default");
    },
    execute: async function(status, options) {
      try {
        const result = await alertDialog.confirmQuestion(lang.perspectivePageDeleteDialogMessage.replace("{0}", options.eventData.view.model.get("title")), lang.DeleteButtonLabel, {
          buttons: {
            showYes: true,
            labelYes: lang.DeleteButtonLabel,
            showNo: false,
            showCancel: true,
            labelCancel: lang.editPageCancelButton
          }
        });
        result && this.executeDelete(status, options);
      } catch (error) {}
    },
    removePerspectiveModelFromCollection: function(view) {
      let successMSg = lang.perspectivePageDeleteSuccessMessage.replace("{0}", view.model.get("title"));
      try {
        let originatingView = view.options.originatingView;
        const perspectiveCollection = originatingView.topRibbonView.collection;
        const index = perspectiveCollection.indexOf(view.model);
        const children = originatingView.topRibbonView?.children;
        perspectiveCollection.remove(view.model);
        if (view.el.classList?.contains("binf-active") && perspectiveCollection.length) {
          children.findByIndex(Math.max(index - 1, 0))?.updatePerspective();
        }
        originatingView.trigger("toggle:carousel");
        originatingView.trigger("toggle:save");
        GlobalMessage.showMessage("success", successMSg);
      } catch (error) {
        GlobalMessage.showMessage("error", lang.perspectivePageDeleteErrorMessage);
      }
    },
    executeDelete: async function(status, options) {
      let view = options.eventData?.view;
      const id = view.model.get("av_id");
      if (!id) {
        this.removePerspectiveModelFromCollection(view);
        return;
      }
      const connector = view.options.originatingView.connector;
      const fullUrl = Url.combine(connector.getConnectionUrl().getApiBase("v1"), `/nodes/${id}`);
      const executeOptions = {
        type: "DELETE",
        url: fullUrl
      };
      try {
        await connector.makeAjaxCall(executeOptions);
        this.removePerspectiveModelFromCollection(view);
      } catch (error) {
        const errorMessage = error?.responseJSON?.error ?? lang.perspectivePageDeleteDialogMessage.replace("{0}", view.model.get("title"));
        GlobalMessage.showMessage("error", errorMessage);
      }
    }
  });
  return PerspectiveDeleteCommand;
});