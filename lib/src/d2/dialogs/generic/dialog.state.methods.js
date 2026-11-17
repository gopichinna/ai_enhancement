/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogStateMethod from "d2/sdk/controls/dialogs/generic/dialog.state.method";

import D2FSStateMethod from "d2/dialogs/generic/impl/state.methods/d2fs.state.method";

import RuleMatcherCollection from "dctmw/utils/rule.matcher.collection";

class DialogStateMethodModel extends RuleMatcherCollection.prototype.model {
  #methodInstance;
  constructor(attr, options = {}) {
    super(attr, options);
  }
  getMethod() {
    if (!this.#methodInstance) {
      const MethodClass = this.get("methodClass");
      if (typeof MethodClass === "function") {
        try {
          this.#methodInstance = new MethodClass();
        } catch (e) {
          console.warn(e);
        }
      }
      if (!(this.#methodInstance instanceof DialogStateMethod)) {
        this.#methodInstance = new DialogStateMethod();
      }
    }
    return this.#methodInstance;
  }
  execute(options = {}, result = {}) {
    return new Promise((res, rej) => {
      const retVal = this.getMethod().execute(options, result);
      if (retVal instanceof Promise) {
        retVal.then(res, rej);
        return;
      }
      res(retVal);
    });
  }
}

Object.assign(DialogStateMethodModel.prototype, {
  defaults: {
    sequence: 1e4,
    methodClass: null
  }
});

class DialogStateMethods extends RuleMatcherCollection {
  constructor(models = [], options = {}) {
    super(models, options);
  }
  execute(options = {}, result = {}) {
    const rules = this.filter(model => {
      return model.matchRules({
        ...options
      }, model.attributes);
    });
    let lastPromise = Promise.resolve(true);
    for (const rule of rules) {
      const cbSuccess = function(retVal) {
        if (retVal === false) {
          return false;
        }
        return this.execute({
          ...options
        }, result);
      }.bind(rule);
      lastPromise = lastPromise.then(cbSuccess);
    }
    return lastPromise.then(() => result);
  }
}

Object.assign(DialogStateMethods.prototype, {
  model: DialogStateMethodModel,
  comparator: "sequence"
});

const defaultMethodRules = [ {
  includes: {
    method: [ "GET", "VALIDATE", "CANCEL" ]
  },
  methodClass: D2FSStateMethod
} ];

const dialogStateMethods = new DialogStateMethods(defaultMethodRules);

export default dialogStateMethods;