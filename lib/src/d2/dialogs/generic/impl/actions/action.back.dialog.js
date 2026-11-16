/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogAction from "d2/sdk/controls/dialogs/generic/dialog.action";

class ActionBackDialog extends DialogAction {
  execute(options = {}) {
    const {
      dialog,
      dialogState
    } = options;
    return dialogState.previousForm().then(formData => {
      const {
        formName
      } = formData;
      dialog.gotoStep(formName);
    });
  }
}

Object.defineProperty(ActionBackDialog.prototype.constructor, "name", {
  value: "ActionBackDialog"
});

export default ActionBackDialog;