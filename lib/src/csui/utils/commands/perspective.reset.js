/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/backbone", "csui/models/perspective.command", "i18n!csui/perspective.manage/impl/nls/lang" ], function(require, Backbone, PerspectiveCommand, lang) {
  "use strict";
  const PerspectiveResetCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveReset"
    },
    execute: async function(status, options) {
      const modalAlert = await require("csui/dialogs/modal.alert/modal.alert");
      const globalMessage = await require("csui/controls/globalmessage/globalmessage");
      try {
        await modalAlert.confirmQuestion(lang.resetConfirmMsg, lang.confirmReset, {
          buttons: {
            showYes: true,
            labelYes: lang.reset,
            showNo: false,
            showCancel: true
          }
        });
        const view = options.eventData.view;
        if (view.isActiveChild()) {
          let perspective = view.model.options.perspective;
          perspective.options.perspectiveMode = view.options.originatingView.mode;
          const originalConfig = new Backbone.Model(perspective);
          view.options.originatingView.context.triggerMethod("enter:edit:perspective", originalConfig);
          this.listenToOnce(view.options.originatingView.context, "finish:enter:edit:perspective", function() {
            globalMessage.showMessage("success", lang.resetSuccessful);
          });
        } else {
          let originalPerspective = view.model.options.perspective;
          let extraAttributes = {
            default: view.model.get("default"),
            title: view.model.getTitle()
          };
          if (view.model.has("hasOnlybasicPerspectiveInfo")) {
            extraAttributes.hasOnlybasicPerspectiveInfo = view.model.get("hasOnlybasicPerspectiveInfo");
          }
          view.model.clear();
          view.model.update(originalPerspective);
          view.model.set(extraAttributes);
          globalMessage.showMessage("success", lang.resetSuccessful);
        }
        view.markPerspectiveAsModified(view.model);
      } catch (result) {}
    }
  });
  return PerspectiveResetCommand;
});