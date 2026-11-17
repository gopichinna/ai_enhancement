/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogAction from "d2/sdk/controls/dialogs/generic/dialog.action";

class ActionValidDialog extends DialogAction {
  execute(options = {}) {
    const {
      formView,
      dialogState,
      dialog
    } = options;
    return formView.validateForm(true).then(isValid => {
      if (isValid) {
        const formValues = formView.getFlatFormValueMap(formView.getValues());
        return dialogState.validateForm(formValues).then(formData => {
          const {
            formName,
            formSchema: {
              generalConfig
            }
          } = formData;
          if (generalConfig) {
            dialog.gotoStep(formName);
          } else {
            dialog.close(formData);
          }
        });
      } else {
        return false;
      }
    });
  }
}

Object.defineProperty(ActionValidDialog.prototype.constructor, "name", {
  value: "ActionValidDialog"
});

export default ActionValidDialog;