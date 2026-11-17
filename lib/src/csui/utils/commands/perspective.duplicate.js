/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/perspective.command", "smart/dialogs/modal.alert/modal.alert", "smart/controls/globalmessage/globalmessage", "csui/perspective.manage/impl/landing.page.pman.constants", "i18n!csui/utils/commands/nls/localized.strings" ], function(PerspectiveCommand, AlertDialog, GlobalMessage, PmanConstants, lang) {
  "use strict";
  const PerspectiveDuplicateCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveDuplicate"
    },
    beforeExecute: async function(status, options) {
      await PerspectiveCommand.prototype.beforeExecute.apply(this, arguments);
      this.model = this.view.model;
      if (this.model.collection.modifiedCount >= PmanConstants.MAX_THRESHOLD) {
        await this.view.options.originatingView.promptToSaveModifiedPerspectives(this.model);
        throw "";
      }
    },
    execute: async function(status, options) {
      if (this.model.getPerspectiveRules()?.length) {
        try {
          const result = await AlertDialog.confirmQuestion(lang.perspectivePageDuplicateDialogMessage.replace("{0}", this.model?.getTitle()), lang.duplicateButtonLabel, {
            buttons: Object.assign({
              labelYes: lang.copyButtonLabel,
              labelNo: lang.skipButtonLabel
            }, AlertDialog.buttons.YesNoCancel)
          });
          options.copyRules = true;
          result && this.executeDuplicate(status, options);
        } catch (error) {
          if (error !== undefined) {
            options.copyRules = false;
            this.executeDuplicate(status, options);
          }
        }
      } else {
        this.executeDuplicate(status, options);
      }
    },
    executeDuplicate: async function(status, options) {
      try {
        const topRibbonView = options.eventData.view.options?.originatingView?.topRibbonView;
        const newName = topRibbonView?.getNextPerspectiveName(`${this.model.getTitle()}_1`, true);
        topRibbonView?.triggerMethod("add:new:perspective", this.model.get("perspective"), newName);
        const model = topRibbonView.collection.findWhere({
          title: newName
        });
        model.set({
          rules: options.copyRules ? this.model.getPerspectiveRules() ?? [] : []
        });
        GlobalMessage.showMessage("success", lang.perspectivePageDuplicateSuccessMessage.replace("{0}", this.model?.getTitle()));
      } catch (error) {
        let errorMessage;
        if (error?.responseJSON?.error) {
          errorMessage = error.responseJSON.error;
        } else {
          errorMessage = lang.perspectivePageDuplicateFailMessage.replace("{0}", this.model?.getTitle());
        }
        GlobalMessage.showMessage("error", errorMessage);
      } finally {
        this.unblockActions();
      }
    }
  });
  return PerspectiveDuplicateCommand;
});