/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import ConnectorFactory from "nuc/contexts/factories/connector";

import {
  combine,
  combineQueryString,
  appendQuery
} from "nuc/utils/url";

import UriTemplate from "dctmw/lib/uri-templates";

import DialogStateMethod from "d2/sdk/controls/dialogs/generic/dialog.state.method";

import Session from "dctmw/utils/authenticators/session";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

import {
  MediaTypes
} from "d2/utils/constants";

import {
  parseAjaxError
} from "dctmw/utils/utils";

const METHOD_TO_ACTION_MAP = {
  GET: "GET",
  VALIDATE: "SUBMIT",
  CANCEL: "CANCEL"
};

class D2FSStateMethod extends DialogStateMethod {
  constructor(options = {}) {
    super(options);
    this.connector = Session.get().getContext().getObject(ConnectorFactory);
    this.baseUrlTemplate = new UriTemplate(RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_GENERIC_DIALOG));
  }
  execute(options, result) {
    return new Promise((res, rej) => {
      const {
        dialogId,
        formName,
        method,
        nodes,
        actionParams,
        formData
      } = options, action = METHOD_TO_ACTION_MAP[method] || method, additionalParams = this.getDialogAdditonalParams(options), rBody = {};
      this.setDialogContextForm(dialogId, action, formName);
      const url = appendQuery(combine(this.baseUrlTemplate.fillFromObject({
        "dialog-name": this.getDialogContextForm(dialogId, action) || formName
      })), combineQueryString({
        action: action,
        object_ids: nodes.length ? nodes.pluck("id") : "0000000000000000"
      }));
      if (_.isObject(actionParams) && !_.isEmpty(actionParams)) {
        rBody["action_params"] = actionParams;
      }
      if (_.isObject(additionalParams) && !_.isEmpty(additionalParams)) {
        rBody["additional_params"] = additionalParams;
      }
      if (_.isObject(formData) && !_.isEmpty(formData)) {
        rBody["properties"] = formData;
      }
      $.ajax(this.connector.extendAjaxOptions({
        type: "POST",
        url: url,
        data: JSON.stringify(rBody),
        contentType: MediaTypes.DCTM_JSON,
        success: resp => {
          let pageContent = resp["page-content"] || {};
          options.formData ??= {};
          _.extend(options.formData, _.isObject(pageContent["success"]) ? this.extractMergeableFormDataFromResponse(pageContent["success"]) : {});
          let nextDialogName = this._findNextDialog(pageContent);
          if (nextDialogName) {
            this.execute({
              ...options,
              method: "GET",
              formName: nextDialogName
            }, result).then(res, rej);
            return;
          }
          if (pageContent["success"] === "") {
            this.clearDialogContextForm(dialogId);
          }
          _.extend(result, resp);
          res(result);
        },
        error: (xhr, status, error) => {
          const e = parseAjaxError(xhr, status, error, true);
          rej(e);
        }
      }));
    });
  }
  setDialogContextForm(dialogId, action, currentFormName) {
    this._checkAndInitDlgContext();
    if (action === "GET") {
      this.DLG_ACTIVE_CONTEXT[dialogId] = currentFormName;
    }
  }
  getDialogContextForm(dialogId) {
    this._checkAndInitDlgContext();
    return this.DLG_ACTIVE_CONTEXT[dialogId];
  }
  clearDialogContextForm(dialogId) {
    this._checkAndInitDlgContext();
    delete this.DLG_ACTIVE_CONTEXT[dialogId];
  }
  getDialogAdditonalParams(options) {
    const {
      formName,
      formResponseSet
    } = options;
    return _.omit(formResponseSet?.[formName]?.["page-content"]?.dialog, function(value) {
      if (_.isObject(value)) {
        return true;
      }
      if (_.isArray(value) && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (_.isObject(value[i]) || _.isArray(value[i])) {
            return true;
          }
        }
      }
      return false;
    });
  }
  extractMergeableFormDataFromResponse(success) {
    return _.omit(success, function(value, key) {
      if (_.includes([ "nextDialogName", "message" ], key)) {
        return true;
      }
      if (_.isObject(value)) {
        return true;
      }
      if (_.isArray(value) && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (_.isObject(value[i]) || _.isArray(value[i])) {
            return true;
          }
        }
      }
      return false;
    });
  }
  _checkAndInitDlgContext() {
    this.DLG_ACTIVE_CONTEXT = _.isObject(this.DLG_ACTIVE_CONTEXT) ? this.DLG_ACTIVE_CONTEXT : {};
  }
  _findNextDialog(dlg) {
    let nextDialogName;
    Object.keys(dlg).find(k => {
      nextDialogName = dlg[k]["nextDialogName"];
      return !!nextDialogName;
    });
    return nextDialogName;
  }
}

Object.defineProperty(D2FSStateMethod.prototype.constructor, "name", {
  value: "D2FSStateMethod"
});

export default D2FSStateMethod;