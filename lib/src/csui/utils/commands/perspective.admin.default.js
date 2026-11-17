/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/perspective.command", "csui/utils/url", "smart/dialogs/modal.alert/modal.alert", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, PerspectiveCommand, Url, AlertDialog, lang) {
  "use strict";
  const PerspectiveAdminDefaultCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveSetAsAdminDefault"
    },
    enabled: function(status, options) {
      const model = status.options.view.model;
      const id = model.getPerspectiveId();
      if (model.get("default") || !model.get("enabled") || !id) {
        return false;
      }
      return false;
    },
    execute: async function(status, options) {
      const selectedView = options.eventData?.view;
      this.selectedModel = selectedView?.model;
      const hasRulesOrDeptInClient = !!this.selectedModel.get("rules")?.length || this.selectedModel.get("departmentId")?.length;
      const title = this.selectedModel.get("title");
      const messageTemplate = hasRulesOrDeptInClient ? lang.defaultPerspectiveMessageWithRules : lang.defaultPerspectiveDialogMessage;
      const message = messageTemplate.replace("{0}", title);
      try {
        let result;
        if (hasRulesOrDeptInClient) {
          result = await AlertDialog.confirmInformation(message, lang.setDefaultPerspectiveLabel, {
            buttons: {
              showYes: true,
              labelYes: lang.editButtonLabel,
              showNo: false,
              showCancel: true,
              labelCancel: lang.editPageCancelButton
            }
          });
        } else {
          result = await AlertDialog.confirmQuestion(message, lang.setDefaultPerspectiveLabel, {
            buttons: {
              showYes: true,
              labelYes: lang.confirmButtonLabel,
              showNo: false,
              showCancel: true,
              labelCancel: lang.editPageCancelButton
            }
          });
        }
        if (result) {
          this.executeDefault(selectedView, options, hasRulesOrDeptInClient);
        }
      } catch (error) {}
    },
    executeDefault: async function(selectedView, options, hasRulesOrDeptInClient) {
      const isActive = selectedView.el.classList.contains("binf-active");
      const context = selectedView.options.originatingView.context;
      if (hasRulesOrDeptInClient) {
        if (isActive) {
          context.trigger("open:rules", options);
        } else {
          try {
            await selectedView.updatePerspective();
            this.listenToOnce(selectedView.options.originatingView, "perspective:rendered", () => {
              context.trigger("open:rules", options);
            });
          } catch (error) {
            new Error("Failed to switch perspective:", error);
          }
        }
      } else {
        await this.setAsDefaultPerspective(selectedView);
        if (isActive) {
          context.trigger("close:sidepanel", options);
        }
      }
    },
    setAsDefaultPerspective: async function(selectedView) {
      const id = selectedView.model.getPerspectiveId();
      const title = this.selectedModel.get("title");
      const connector = selectedView.options.originatingView.connector;
      const apiUrl = Url.combine(connector.getConnectionUrl().getApiBase("v2"), `perspectives/admin/preference`);
      delete selectedView.model.getPerspective().options?.perspectiveMode;
      const formData = new FormData();
      formData.append("pData", JSON.stringify(selectedView.model));
      const executeOptions = {
        type: "POST",
        url: apiUrl,
        data: formData
      };
      const GlobalMessage = await require("csui/controls/globalmessage/globalmessage");
      try {
        await connector.makeAjaxCall(executeOptions);
        const successMsg = lang.defaultPerspectiveSuccessMessage.replace("{0}", title);
        let prevDefaultModel = selectedView.model.collection.findWhere({
          default: true
        });
        prevDefaultModel?.set("default", false);
        selectedView.model.set("default", true);
        GlobalMessage.showMessage("success", successMsg);
        selectedView.unmarkPerspectiveAsModified();
      } catch (error) {
        let errorMessage;
        if (error?.responseJSON?.error) {
          errorMessage = error.responseJSON.error;
        } else {
          errorMessage = lang.defaultPerspectiveFailMessage.replace("{0}", title);
        }
        GlobalMessage.showMessage("error", errorMessage);
      }
    }
  });
  return PerspectiveAdminDefaultCommand;
});