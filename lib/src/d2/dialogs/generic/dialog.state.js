/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Object as MarionetteObject
} from "nuc/lib/marionette";

import NodeCollection from "nuc/models/nodes";

import DialogSchemaBuilder from "d2/dialogs/generic/dialog.schema.builder";

import dialogStateMethods from "d2/dialogs/generic/dialog.state.methods";

class DialogState extends MarionetteObject {
  #actionParams;
  #nodes;
  #formSet = {};
  #formNames = [];
  #formIndex = -1;
  #id;
  constructor(options = {}) {
    super(options);
    this.#nodes = options.nodes instanceof NodeCollection ? options.nodes : new NodeCollection();
    this.#actionParams = options.data || {};
    this.schemaBuilder = new DialogSchemaBuilder(options);
  }
  previousForm() {
    if (this.#formIndex < 1) {
      return Promise.reject("Previous form does not exist");
    }
    const previousFormName = this.#formNames[this.#formIndex - 1];
    return this.gotoForm(previousFormName);
  }
  nextForm() {
    if (this.#formIndex + 1 < this.#formNames.length) {
      return Promise.reject("Next form does not exist");
    }
    const nextFormName = this.#formNames[this.#formIndex + 1];
    return this.gotoForm(nextFormName);
  }
  getRelativeFormPosition(srcForm, destForm) {
    const srcFormIndex = this.#formNames.indexOf(srcForm), destFormIndex = this.#formNames.indexOf(destForm);
    if (destFormIndex !== -1) {
      return srcFormIndex === -1 || destFormIndex >= srcFormIndex;
    }
    return null;
  }
  getCurrentFormName() {
    return this.#formIndex !== -1 ? this.#formNames[this.#formIndex] : null;
  }
  gotoForm(formName) {
    return new Promise((res, rej) => {
      if (!formName) {
        rej("Form name is missing");
        return;
      }
      const existIndex = this.#formNames.indexOf(formName);
      if (existIndex !== -1) {
        if (existIndex > this.#formIndex) {
          this.#formNames[this.#formIndex++] = this.#formNames[existIndex];
          this.#formNames.length = this.#formIndex + 1;
        } else if (existIndex < this.#formIndex) {
          this.#formIndex = existIndex;
        }
        return res(this.#formSet[this.getCurrentFormName()]);
      } else {
        this.applyFormStateMethod({
          formName: formName,
          method: "GET"
        }).then(res, rej);
      }
    });
  }
  validateForm(formData) {
    return this._invokeDialogService("VALIDATE", formData);
  }
  cancelForm(formData) {
    return this._invokeDialogService("CANCEL", formData);
  }
  _invokeDialogService(method, formData) {
    return this.applyFormStateMethod({
      method: method,
      formData: formData
    });
  }
  applyFormStateMethod(options = {}) {
    let {
      formName,
      method,
      formData
    } = options;
    if (!formName) {
      formName = this.getCurrentFormName();
    }
    if (!_.isString(formName) || _.isEmpty(formName)) {
      return Promise.reject("Unknown current state of the dialog.");
    }
    if (!_.isString(method) || _.isEmpty(method)) {
      return Promise.reject("Missing method name");
    }
    if (this.#formIndex === -1) {
      this.#id = _.uniqueId(formName);
    }
    if (this.#formSet[formName]) {
      this.#formSet[formName].formData = formData;
    }
    const resp = {}, formResponseSet = _.reduce(this.#formSet, function(map, value, key) {
      map[key] = value.originalResponse;
      return map;
    }, {});
    return dialogStateMethods.execute({
      dialogId: this.#id,
      formName: formName,
      nodes: this.#nodes,
      actionParams: {
        ...this.#actionParams
      },
      formResponseSet: formResponseSet,
      ...options
    }, resp).then(() => {
      return new Promise((res, rej) => {
        this.schemaBuilder.buildSchema(formName, _.deepClone(resp["page-content"])).then(formSchema => {
          const result = {
            formName: formName,
            originalResponse: resp,
            formSchema: formSchema
          };
          if (formSchema.generalConfig) {
            const nextFormName = formSchema.generalConfig.id;
            result["formName"] = nextFormName;
            this.#formSet[nextFormName] = result;
            let matchIndex = this.#formNames.indexOf(nextFormName);
            if (matchIndex !== -1) {
              if (matchIndex > this.#formIndex) {
                this.#formIndex++;
                this.#formNames.length = this.#formIndex + 1;
                this.#formNames[this.#formIndex] = nextFormName;
              } else {
                this.#formIndex = matchIndex;
              }
            } else {
              this.#formNames.push(nextFormName);
              this.#formIndex = this.#formNames.length - 1;
            }
          }
          res(result);
        }).catch(rej);
      });
    }).catch(e => {
      console.error(e.errorDetails || e.details || e.message);
      throw e;
    });
  }
}

Object.defineProperty(DialogState.prototype.constructor, "name", {
  value: "DialogState"
});

export default DialogState;