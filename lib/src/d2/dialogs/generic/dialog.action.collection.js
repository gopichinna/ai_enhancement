/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogAction from "d2/sdk/controls/dialogs/generic/dialog.action";

import DefaultDialogAction from "d2/sdk/controls/dialogs/generic/dialog.action";

import RuleMatcherCollection from "dctmw/utils/rule.matcher.collection";

import ActionValidDialog from "d2/dialogs/generic/impl/actions/action.valid.dialog";

import ActionCancelDialog from "d2/dialogs/generic/impl/actions/action.cancel.dialog";

import ActionBackDialog from "d2/dialogs/generic/impl/actions/action.back.dialog";

class DialogActionRule extends RuleMatcherCollection.prototype.model {
  #actionInstance;
  constructor(attr, options = {}) {
    super(attr, options);
  }
  getAction() {
    if (!this.#actionInstance) {
      const ActionClass = this.get("action");
      if (ActionClass) {
        try {
          this.#actionInstance = new ActionClass();
        } catch (e) {
          console.warn(e);
          this.#actionInstance = new DefaultDialogAction();
        }
      }
    }
    return this.#actionInstance;
  }
}

Object.assign(DialogActionRule.prototype, {
  defaults: {
    sequence: 1e4,
    action: null
  }
});

class DialogActionRules extends RuleMatcherCollection {
  constructor(models = [], options = {}) {
    super(models, options);
  }
  findAction(formName, buttonAttributes) {
    const rule = this.find(model => {
      return model.matchRules({
        formName: formName,
        button: buttonAttributes
      }, model.attributes);
    });
    if (rule) {
      const action = rule.getAction();
      if (action instanceof DialogAction) {
        return action;
      }
    }
    return new DefaultDialogAction();
  }
}

Object.assign(DialogActionRules.prototype, {
  model: DialogActionRule,
  comparator: "sequence"
});

const defaultActionRules = [ {
  equals: {
    "button.id": "buttonOk"
  },
  action: ActionValidDialog
}, {
  includes: {
    "button.id": [ "buttonCancel", "cancel" ]
  },
  action: ActionCancelDialog
}, {
  equals: {
    "button.id": "previous"
  },
  action: ActionBackDialog
} ];

const dialogActions = new DialogActionRules(defaultActionRules);

export default dialogActions;