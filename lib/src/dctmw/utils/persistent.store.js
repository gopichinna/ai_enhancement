/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  Object as MarionetteObject
} from "nuc/lib/marionette";

import {
  Model,
  Collection
} from "nuc/lib/backbone";

import logger from "nuc/utils/log";

import utils from "dctmw/utils/utils";

import DctmPrefStoreServerAdaptorMixin from "dctmw/server.adaptors/models/dctmw/dctm.pref.store.server.adaptor.mixin";

const DEFAULT_STORE_NAME = "sv", SERVER_PROP_NAME = "preference-content";

const DEFAULT_STORE_NS = DEFAULT_STORE_NAME;

const log = logger(module.id);

let {
  storeName = DEFAULT_STORE_NAME,
  enablePersistence = true
} = module.config();

if (!utils.isNonEmptyString(storeName)) {
  storeName = DEFAULT_STORE_NAME;
}

storeName = storeName.toLowerCase();

function isEnabled() {
  return enablePersistence === true;
}

class StoteImpl extends MarionetteObject {
  #properties = {};
  #moduleBaseUrl;
  #tsPendingUpdate = 0;
  #tsLastUpdate = 0;
  #updateInProgress = false;
  #storeEnsured = false;
  #acceptingStoreChanges = true;
  #localStore = null;
  constructor(options = {}) {
    options.storeName = storeName;
    options.enabled = isEnabled();
    super(options);
    this.makePrefStore(options);
    log.info(`Persistence store is named: '${this.options.storeName}' and it is '${isEnabled() ? "enabled" : "disabled"}'`) && console.log(log.last);
    this.#moduleBaseUrl = $("<a>").prop("href", window.sv.config.svfPackagePath).prop("href");
    log.debug(`Module base URL: ${this.#moduleBaseUrl}`) && console.log(log.last);
    $(document).on("pageidle", () => {
      this.updateStore();
    });
  }
  toJSON(tsUpdate) {
    const out = {};
    out[SERVER_PROP_NAME] = JSON.stringify({
      data: Object.keys(this.#properties).reduce((acc, k) => {
        acc[k] = this.#properties[k].toJSON();
        return acc;
      }, {}),
      ts: tsUpdate
    });
    return out;
  }
  _getCallerNS() {
    const e = new Error("test");
    const sTrace = e.stack.split("\n").filter(entry => entry.indexOf(this.#moduleBaseUrl) >= 0).map(e => e.trim());
    if (sTrace.length < 1) {
      return DEFAULT_STORE_NS;
    }
    const getFilePathFromTraceEntry = e => {
      e = e.substring(e.indexOf(this.#moduleBaseUrl) + this.#moduleBaseUrl.length);
      const eParts = e.split(":");
      e = eParts[0].split("").reverse().join("");
      e = e.substring(e.indexOf("sj.")).split("").reverse().join("");
      return e.startsWith("/") ? e.substring(1) : e;
    };
    let lastFilePath = getFilePathFromTraceEntry(sTrace[0]);
    let ns;
    let firstNonMatchingIndex;
    for (let i = 1; i < sTrace.length; i++) {
      let filePath = getFilePathFromTraceEntry(sTrace[i]);
      if (filePath !== lastFilePath) {
        log.debug(`File path with deviation : ${filePath}`) && console.log(log.last);
        firstNonMatchingIndex = i;
        ns = filePath.substring(0, filePath.indexOf("/"));
        break;
      }
    }
    const prevTrace = sTrace[firstNonMatchingIndex - 1];
    if (prevTrace.indexOf("getModelStore") < 0 && prevTrace.indexOf("getCollectionStore") < 0) {
      const filePath = getFilePathFromTraceEntry(prevTrace);
      log.debug(`Deviation pattern adjusted to : ${filePath}`) && console.log(log.last);
      ns = filePath.substring(0, filePath.indexOf("/"));
    }
    return utils.isNonEmptyString(ns) ? ns : DEFAULT_STORE_NS;
  }
  _getNormalizedStoreKey(key) {
    const normKey = `${this._getCallerNS()}:${key}`;
    log.debug(`Normalized storage access key is ${normKey} for given key ${key}`) && console.log(log.last);
    return normKey;
  }
  _hasUnsavedChanges() {
    return this.#tsPendingUpdate >= this.#tsLastUpdate;
  }
  _markPendingUpdate() {
    if (this.#acceptingStoreChanges) {
      this.#tsPendingUpdate = new Date().getTime();
      if (this.#storeEnsured) {
        this.#getLocalStore().set("data", this.toJSON(this.#tsPendingUpdate));
      }
      this._attachUnloadEventListener();
    }
  }
  _beforeUnloadEventName() {
    return "beforeunload.pstore";
  }
  _attachUnloadEventListener() {
    const eName = this._beforeUnloadEventName();
    $(window).off(eName).on(eName, () => {
      this.updateStore({
        immediate: this._hasUnsavedChanges()
      });
    });
  }
  _detachUnloadEventListener() {
    $(window).off(this._beforeUnloadEventName());
  }
  _attachModelEvents(model) {
    this.listenTo(model, "change", this._markPendingUpdate);
  }
  _detachModelEvents(model) {
    this.stopListening(model, "change");
  }
  _attachCollectionEvents(col) {
    this.listenTo(col, "reset update change", this._markPendingUpdate);
  }
  _detachCollectionEvents(col) {
    this.stopListening(col, "reset update change");
  }
  _collateDataIntoModel(model, data) {
    if (model instanceof Model && _.isObject(data) && !_.isEmpty(data)) {
      const nonExistingValues = {};
      Object.keys(data).forEach(k => {
        if (!model.has(k)) {
          nonExistingValues[k] = data[k];
        }
      });
      if (!_.isEmpty(nonExistingValues)) {
        model.set(nonExistingValues);
      }
    }
  }
  _collateDataIntoCollection(col, data) {
    if (col instanceof Collection && _.isArray(data) && data.length) {
      const addableModelsData = [];
      data.forEach((e, i) => {
        if (i < col.length) {
          this._collateDataIntoModel(col.at(i), e);
        } else if (_.isObject(e) && !_.isEmpty(e)) {
          addableModelsData.push(e);
        }
      });
      if (addableModelsData.length) {
        col.add(addableModelsData);
      }
    }
  }
  getModel(key, options = {}) {
    const normalizedKey = this._getNormalizedStoreKey(key);
    let store = this.#properties[normalizedKey];
    if (!store && options.create !== false) {
      store = new Model({});
      this.#properties[normalizedKey] = store;
      this._attachModelEvents(store);
    }
    if (store && !(store instanceof Model)) {
      throw new Error(`Accessor type mismatch: ${key} is not a model store`);
    }
    this._collateDataIntoModel(store, options.defaultValues);
    return store;
  }
  getCollection(key, options = {}) {
    const normalizedKey = this._getNormalizedStoreKey(key);
    let store = this.#properties[normalizedKey];
    if (!store && options.create !== false) {
      store = new Collection([]);
      this.#properties[normalizedKey] = store;
      this._attachCollectionEvents(store);
    }
    if (store && !(store instanceof Collection)) {
      throw new Error(`Accessor type mismatch: ${key} is not a collection store`);
    }
    this._collateDataIntoCollection(store, options.defaultValues);
    return store;
  }
  initFrom(str) {
    if (utils.isNonEmptyString(str)) {
      log.debug(`Initializing persistence store : '${this.options.storeName}' from content "${str}"`) && console.log(log.last);
      try {
        const storedJson = JSON.parse(str);
        const data = storedJson?.data || {};
        Object.keys(data).forEach(k => {
          const v = data[k];
          let store = this.#properties[k];
          if (_.isArray(v)) {
            if (!store) {
              store = new Collection();
            }
          } else if (_.isObject(v)) {
            if (!store) {
              store = new Model();
            }
          }
          this.#properties[k] = store;
          if (store instanceof Model) {
            this._detachModelEvents(store);
            store.clear({
              silent: true
            });
            store.set(v);
            this._attachModelEvents(store);
          } else if (store instanceof Collection) {
            this._detachCollectionEvents(store);
            store.reset(v);
            this._attachCollectionEvents(store);
          }
        });
        this.#tsLastUpdate = storedJson.ts || new Date().getTime();
      } catch (e) {
        log.warn(`"${str}" is not JSON. Persistent store : '${this.options.storeName}' is effectively reset to empty state`) && console.warn(log.last);
      }
    } else if (str !== "") {
      throw new Error("Can not init from other than string input");
    }
  }
  createStore() {
    const dfd = $.Deferred();
    this._addStoreEnsureMarker(dfd);
    if (isEnabled()) {
      log.debug(`Creating persistent store: '${this.options.storeName}'`);
      this.#updateInProgress = true;
      const tsUPD = new Date().getTime();
      this._createStore({
        data: this.toJSON(tsUPD)
      }).done(() => {
        this.#tsLastUpdate = tsUPD;
        this._detachUnloadEventListener();
        dfd.resolve();
      }).fail(dfd.reject).always(() => {
        this.#updateInProgress = false;
      });
    } else {
      dfd.resolve();
    }
    return dfd.promise();
  }
  fetchStore() {
    const dfd = $.Deferred();
    this._addStoreEnsureMarker(dfd);
    if (isEnabled()) {
      log.debug(`Fetching persistent store: '${this.options.storeName}'`);
      this._fetchStore({}).done(resp => {
        const serverPref = resp?.[SERVER_PROP_NAME];
        const data = this.#lookupLocalData(serverPref);
        const syncPref = serverPref !== data;
        try {
          this.initFrom(data ?? "");
          if (syncPref && data) {
            this.updateStore({
              skipBackup: true,
              immediate: true
            }).always(dfd.resolve);
          } else {
            dfd.resolve();
          }
        } catch (e) {
          dfd.reject(e);
        }
      }).fail(dfd.reject);
    } else {
      dfd.resolve();
    }
    return dfd.promise();
  }
  #lookupLocalData(serverPref) {
    const lStore = this.#getLocalStore();
    const localData = lStore.get("data");
    if (localData?.[SERVER_PROP_NAME] && serverPref) {
      try {
        const localPrefObj = JSON.parse(localData[SERVER_PROP_NAME]);
        const serverPrefObj = JSON.parse(serverPref);
        if (serverPrefObj.ts && localPrefObj.ts <= serverPrefObj.ts) {
          lStore.destroy();
        } else {
          return localData[SERVER_PROP_NAME];
        }
      } catch (e) {
        log.warn(`Failed to parse the string, so skipping local data restore, and removing local data`) && console.warn(log.last);
        lStore.destroy();
      }
    }
    return serverPref;
  }
  #getLocalStore() {
    if (!this.#localStore) {
      this.#localStore = utils.getLocalStore(this.options.storeName);
    }
    return this.#localStore;
  }
  updateStore(options = {}) {
    const dfd = $.Deferred();
    const {
      immediate = false,
      skipBackup = false
    } = options;
    if (isEnabled() && (immediate || !this.#updateInProgress && this._hasUnsavedChanges())) {
      this.#updateInProgress = true;
      this._addStoreEnsureMarker(dfd);
      log.debug(`Updating persistent store: '${this.options.storeName}'`);
      const tsUPD = new Date().getTime();
      const storeData = this.toJSON(tsUPD);
      if (!skipBackup) {
        this.#getLocalStore().set("data", storeData);
      }
      this._updateStore({
        data: storeData
      }).done(() => {
        this.#updateInProgress = false;
        this.#tsLastUpdate = tsUPD;
        this._detachUnloadEventListener();
        this.#getLocalStore().destroy();
        dfd.resolve();
      }).fail((xhr, textStatus, error) => {
        this._storeApiFailureHandler(xhr, textStatus, error).always(() => {
          this.#updateInProgress = false;
        }).done(() => {
          this.#tsLastUpdate = tsUPD;
          this._detachUnloadEventListener();
          dfd.resolve();
        }).fail(dfd.reject);
      });
    } else {
      dfd.resolve();
    }
    return dfd.promise();
  }
  ensureStore() {
    const dfd = $.Deferred();
    if (!this.#storeEnsured) {
      log.info(`Ensuring persistence store: '${this.options.storeName}'`);
      this._addStoreEnsureMarker(dfd);
      this.fetchStore().done(dfd.resolve).fail((xhr, textStatus, error) => {
        this._storeApiFailureHandler(xhr, textStatus, error).done(dfd.resolve).fail(dfd.reject);
      });
    } else {
      log.debug(`Persistent store: '${this.options.storeName}' already ensured.`);
      dfd.resolve();
    }
    return dfd.promise();
  }
  resetStore() {
    const dfd = $.Deferred();
    const fnRetry = () => {
      this.resetStore().done(dfd.resolve).fail(dfd.reject);
    };
    if (isEnabled()) {
      this.#acceptingStoreChanges = false;
      if (this.#storeEnsured && !this.#updateInProgress) {
        this._removeStore().fail(() => {
          setTimeout(fnRetry, 1e3);
        }).done(() => {
          this.#tsLastUpdate = new Date().getTime();
          this.#acceptingStoreChanges = true;
          dfd.resolve();
        });
      } else {
        setTimeout(fnRetry, 1e3);
      }
    } else {
      dfd.resolve();
    }
    return dfd.promise();
  }
  _storeApiFailureHandler(xhr, textStatus, error) {
    const dfd = $.Deferred();
    const {
      status
    } = xhr;
    if (status === 404) {
      log.info(`Persistence store: '${this.options.storeName}' does not exist, will create it and cleaning the local data`) && console.log(log.last);
      this.#getLocalStore().destroy();
      this.createStore().done(dfd.resolve).fail(dfd.reject);
    } else {
      log.error(`unable to save the data to persistence store: '${this.options.storeName}'`) && console.error(log.last);
      dfd.reject(error);
    }
    return dfd.promise();
  }
  _addStoreEnsureMarker(dfd) {
    dfd.promise().done(() => {
      this.#storeEnsured = true;
    });
  }
}

DctmPrefStoreServerAdaptorMixin.mixin(StoteImpl.prototype);

class PersistentStore {
  #storeImpl;
  constructor() {
    this.#storeImpl = new StoteImpl();
  }
  getModelStore(key, options) {
    return this.#storeImpl.getModel(key, options);
  }
  getCollectionStore(key, options) {
    return this.#storeImpl.getCollection(key, options);
  }
  ensureStore() {
    return this.#storeImpl.ensureStore();
  }
  resetStore() {
    return this.#storeImpl.resetStore();
  }
}

Object.defineProperty(PersistentStore.prototype.constructor, "name", {
  value: "PersistentStore"
});

const storeInstance = Object.freeze(new PersistentStore());

export default storeInstance;