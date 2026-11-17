/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ConnectorFactory from "nuc/contexts/factories/connector";

import log from "nuc/utils/log";

import Url from "nuc/utils/url";

import CommandHelper from "csui/utils/commandhelper";

import alertDialog from "smart/dialogs/modal.alert/modal.alert";

import Session from "dctmw/utils/authenticators/session";

import RestResources from "dctmw/utils/rest.resources";

import constants from "d2/utils/constants";

import RestLinkrels from "d2/utils/rest.linkrels";

import {
  workerFunction
} from "d2/utils/workerInstanceRefresh";

import lang from "i18n!d2/utils/impl/nls/lang";

class AutoReloadNode {
  constructor() {
    this.connector = Session.get().getContext().getObject(ConnectorFactory);
    this._nodePollingActive = false;
    this._worker = null;
    this._workerBlobUrl = null;
    this._lastReservedMap = {};
    const rawExts = RestResources.d2Options?.oes_supported_extensions || [];
    this._supportedExts = rawExts.map(ext => ext.replace(/^\./, "").toLowerCase());
  }
  startAutoReload(collection) {
    this.collection = collection;
    this._nodePollingActive = true;
    if (!this._worker) {
      const blob = new Blob([ "(" + workerFunction.toString() + ")()" ], {
        type: "text/javascript"
      });
      const blobUrl = URL.createObjectURL(blob);
      this._worker = new Worker(blobUrl);
      this._workerBlobUrl = blobUrl;
      this._worker.onmessage = event => {
        const {
          status,
          data,
          response,
          error
        } = event.data;
        if (status === "success" && this._nodePollingActive) {
          const statusMap = this.parseCheckedOutStatus(data);
          this.collection.each(node => {
            const id = node.get("id");
            if (!statusMap[id]) {
              return;
            }
            const newReserved = statusMap[id].reserved || "";
            const oldReserved = this._lastReservedMap[id] || "";
            if (newReserved !== oldReserved) {
              const filename = node.get("name") || "";
              const ext = filename.split(".").pop().toLowerCase();
              if (this._supportedExts.includes(ext) && this._nodePollingActive) {
                CommandHelper.refreshNode(node);
              }
              this._lastReservedMap[id] = newReserved;
            }
          });
        } else if (status === "unauthorized") {
          if (!this.confirmingReload) {
            this.confirmingReload = true;
            const dialogTitle = this._succeeded ? lang.SessionExpiredDialogTitle : lang.AuthenticationFailureDialogTitle;
            log.warn(error) && console.warn(log.last);
            alertDialog.showWarning(lang.AuthenticationFailureDialogText, dialogTitle, {
              buttons: alertDialog.buttons.Ok
            }).always(() => {
              this.connector.authenticator.unauthenticate({
                reason: "failed"
              });
            });
          }
        } else if (status === "error") {
          const detail = error ?? JSON.stringify(response) ?? "<no details>";
          log.warn(`worker error: ${detail}`);
          console.warn("AutoReloadNode worker error:", detail);
        }
      };
    }
    const repoLinks = RestResources.getCurrentRepository().get("links");
    const base = RestLinkrels.getLink(repoLinks, RestLinkrels.SELF);
    let fullUrl = Url.combine(base, "objects");
    const ids = this.getCurrentContainerObjectIds();
    const filterValue = ids.map(id => `'${id}'`).join(",");
    const qParams = {
      filter: `r_object_id=(${filterValue})`,
      inline: true,
      view: "r_lock_owner",
      "include-all-versions": true
    };
    fullUrl = Url.appendQuery(fullUrl, Url.combineQueryString(qParams));
    const ajaxOpts = this.connector.extendAjaxOptions({
      headers: {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      }
    });
    const fetchOptions = {
      method: "GET",
      headers: ajaxOpts.headers,
      credentials: "include"
    };
    this._worker.postMessage({
      cmd: "START",
      payload: {
        url: fullUrl,
        options: fetchOptions,
        interval: constants.AUTO_RELOAD_INTERVAL
      }
    });
  }
  stopAutoReload() {
    this._nodePollingActive = false;
    if (this._worker) {
      this._worker.postMessage({
        cmd: "STOP"
      });
      this._worker.terminate();
      this._worker = null;
    }
    if (this._workerBlobUrl) {
      URL.revokeObjectURL(this._workerBlobUrl);
      this._workerBlobUrl = null;
    }
    AutoReloadNode._instance = null;
  }
  parseCheckedOutStatus(data) {
    const result = {};
    if (data && Array.isArray(data.entries)) {
      data.entries.forEach(entry => {
        const id = entry.id;
        const lockOwner = entry.content?.properties?.r_lock_owner || "";
        result[id] = {
          reserved: lockOwner
        };
      });
    }
    return result;
  }
  getCurrentContainerObjectIds() {
    return this.collection.pluck("id");
  }
  static getInstance() {
    if (!AutoReloadNode._instance) {
      AutoReloadNode._instance = new AutoReloadNode();
    }
    return AutoReloadNode._instance;
  }
  stopAutoReloadPolling() {
    if (this._nodePollingActive) {
      this._nodePollingActive = false;
      this._worker.postMessage({
        cmd: "STOP"
      });
    }
  }
  restart(collection) {
    this.stopAutoReload();
    this.startAutoReload(collection);
  }
}

Object.defineProperty(AutoReloadNode.prototype.constructor, "name", {
  value: AutoReloadNode
});

export default AutoReloadNode;