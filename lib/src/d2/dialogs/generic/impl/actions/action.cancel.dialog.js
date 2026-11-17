/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogAction from "d2/sdk/controls/dialogs/generic/dialog.action";

class ActionCancelDialog extends DialogAction {
  execute(options = {}) {
    const {
      formView,
      dialogState,
      nodes,
      dialog
    } = options, formValues = formView?.getFlatFormValueMap(formView.getValues());
    return dialogState.cancelForm(formValues, nodes).then(formData => {
      const {
        formName,
        formSchema: {
          generalConfig
        }
      } = formData;
      if (generalConfig) {
        dialog.gotoStep(formName);
      } else {
        dialog.cancel();
      }
    });
  }
}

Object.defineProperty(ActionCancelDialog.prototype.constructor, "name", {
  value: "ActionCancelDialog"
});

export default ActionCancelDialog;