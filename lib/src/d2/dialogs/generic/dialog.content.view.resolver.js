/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  View
} from "nuc/lib/marionette";

import DialogContentView from "d2/sdk/controls/dialogs/generic/dialog.content.view";

import DefaultDialogContentView from "d2/dialogs/generic/default.dialog.content.view";

import RuleMatcherCollection from "dctmw/utils/rule.matcher.collection";

class DialogContentViewRule extends RuleMatcherCollection.prototype.model {
  #viewInstance;
  constructor(attr, options = {}) {
    super(attr, options);
  }
  getView() {
    if (!this.#viewInstance) {
      const ViewClass = this.get("viewClass");
      if (typeof ViewClass === "function") {
        try {
          this.#viewInstance = new ViewClass();
        } catch (e) {
          console.warn(e);
        }
      }
    }
    return this.#viewInstance;
  }
}

Object.assign(DialogContentViewRule.prototype, {
  defaults: {
    sequence: 1e4,
    action: null
  }
});

class DialogContentViewResolver extends RuleMatcherCollection {
  constructor(models = [], options = {}) {
    super(models, options);
  }
  findView(options) {
    const rule = this.find(model => {
      return model.matchRules({
        ...options
      }, model.attributes);
    }), dialogContentView = rule && rule.getView();
    return dialogContentView;
  }
  resolveView(options) {
    return new Promise((res, rej) => {
      try {
        let dialogContentView = this.findView(options), retVal = dialogContentView && dialogContentView instanceof DialogContentView && dialogContentView.resolveView(options);
        if (retVal) {
          if (retVal instanceof Promise) {
            retVal.then(dialogContentView => {
              this._resolveDialogContentView(dialogContentView, options).then(res, rej);
            }, e => {
              console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
              this._resolveDefaultDialogContentView(options).then(res, rej);
            });
          } else {
            this._resolveDialogContentView(retVal, options).then(res, rej);
          }
        } else {
          this._resolveDefaultDialogContentView(options).then(res, rej);
        }
      } catch (e) {
        console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
        this._resolveDefaultDialogContentView(options).then(res, rej);
      }
    });
  }
  _resolveDialogContentView(dialogContentView, options) {
    return new Promise((res, rej) => {
      if (dialogContentView) {
        if (dialogContentView instanceof View) {
          res(dialogContentView);
        } else if (typeof dialogContentView === "function") {
          try {
            var view = new dialogContentView(options);
            res(view);
          } catch (e) {
            console.warn("Unable to resolve the dialog view from extension. Resolving dialog view with default view", e);
            this._resolveDefaultDialogContentView(options).then(res, rej);
          }
        }
      } else {
        this._resolveDefaultDialogContentView(options).then(res, rej);
      }
    });
  }
  _getDefaultContentView(options) {
    return new DefaultDialogContentView(options);
  }
  _resolveDefaultDialogContentView(options) {
    return this._getDefaultContentView(options).resolveView(options);
  }
  handleError(e, options) {
    let dialogContentView = this.findView(options);
    if (!dialogContentView || !(dialogContentView instanceof DialogContentView)) {
      dialogContentView = this._getDefaultContentView(options);
    }
    dialogContentView.handleError(e);
  }
}

Object.assign(DialogContentViewResolver.prototype, {
  model: DialogContentViewRule,
  comparator: "sequence"
});

const dialogContentViewResolver = new DialogContentViewResolver();

export default dialogContentViewResolver;