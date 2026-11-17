/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import _ from "nuc/lib/underscore";

import utils from "dctmw/utils/utils";

import {
  constants
} from "dctmw/utils/typed.attribute.mapper";

const config = _.defaults({}, module.config(), {
  ignoredAttributeList: []
});

const ignoredAttributeList = [ "actions", "links", "csuiIsSelected", "hasMetadataRow", "inactive", constants.CLIENT_ATTR_NAME_TYPE_LABEL, ...config.ignoredAttributeList ];

const idMap = new Map();

function getReqCloseMarkerSuccessEventNames() {
  return _.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior() ? "delayed:data:sync" : "sync";
}

function getReqCloseMarkerErrorEventNames() {
  return _.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior() ? "error delayed:data:error" : "error";
}

function reqOpenListener() {
  const fnCloseMarkerSuccess = () => {
    this.stopListening(this, getReqCloseMarkerErrorEventNames.call(this), fnCloseMarkerError);
    reqCloseListener.call(this);
  };
  const fnCloseMarkerError = () => {
    this.stopListening(this, getReqCloseMarkerSuccessEventNames.call(this), fnCloseMarkerSuccess);
    erroneousReqCloseListener.call(this);
  };
  this.stopListening(this, "change", changeListener).listenToOnce(this, getReqCloseMarkerSuccessEventNames.call(this), fnCloseMarkerSuccess).listenToOnce(this, getReqCloseMarkerErrorEventNames.call(this), fnCloseMarkerError);
}

function erroneousReqCloseListener() {
  reqCloseListener.call(this, {
    doNotCaptureState: true
  });
}

function reqCloseListener(options = {}) {
  const {
    doNotCaptureState = false
  } = options;
  doNotCaptureState === false && captureState.call(this);
  this.evaluateState();
  this.listenTo(this, "change", changeListener);
}

function changeListener() {
  this.evaluateState();
}

function captureState() {
  this.__serverAttributes = {};
  _.extend(this.__serverAttributes, _.deepClone(this.attributes));
}

function calcSaveableAttributes() {
  const serverAttrs = this.__serverAttributes || {}, attrs = this.attributes || {};
  const result = {};
  Object.keys(attrs).filter(k => !ignoredAttributeList.includes(k)).forEach(k => {
    const vOld = serverAttrs[k], vNew = attrs[k];
    if (!(_.isArray(vNew) || _.isObject(vNew) ? _.isEqual(vNew, vOld) : vNew === vOld)) {
      result[k] = attrs[k];
    }
  });
  return result;
}

function isSaveOperation(backboneMethod) {
  return [ "create", "update", "patch" ].includes(backboneMethod);
}

const StatefulModelMixin = {
  mixin(prototype) {
    const oSync = prototype.sync;
    Object.assign(prototype, {
      trackState(options = {}) {
        const {
          saveOnlyChangedState = true
        } = options;
        if (!idMap.has(this.cid)) {
          reqCloseListener.call(this);
          this.listenTo(this, "request", reqOpenListener);
        }
        this.__saveOnlyChangedState = _.isBoolean(this.__saveOnlyChangedState) ? this.__saveOnlyChangedState : saveOnlyChangedState;
        return this;
      },
      stopTrackingState() {
        if (idMap.has(this.cid)) {
          this.stopListening(this, "request", reqOpenListener).stopListening(this, "change", changeListener);
          idMap.delete(this.cid);
        }
        return this;
      },
      isStateDirty() {
        return idMap.get(this.cid);
      },
      evaluateState(options = {}) {
        const {
          silent = false
        } = options;
        const isDirty = !_.isEqual(_.omit(this.__serverAttributes, ignoredAttributeList), _.omit(this.attributes, ignoredAttributeList));
        idMap.set(this.cid, isDirty);
        !silent && this.trigger(isDirty ? "state:dirty" : "state:clean", this);
      },
      resetToState(options = {}) {
        const {
          silent = false
        } = options;
        !silent && this.trigger("before:state:reset", this);
        _.keys(this.attributes).forEach(k => {
          if (!_.has(this.__serverAttributes, k)) {
            this.unset(k, {
              silent: silent
            });
          }
        });
        this.set(_.deepClone(this.__serverAttributes), {
          silent: silent
        });
        silent && this.evaluateState({
          silent: silent
        });
        !silent && this.trigger("state:reset", this);
      },
      getServerAttribute(attrName) {
        if (utils.isNonEmptyString(attrName) && this.__serverAttributes && _.isObject(this.__serverAttributes)) {
          return this.__serverAttributes[attrName];
        }
      },
      sync(method, model, options = {}) {
        const {
          attrs,
          silent
        } = options;
        if (!attrs) {
          const saveOnlyChanged = _.isBoolean(options.saveOnlyChangedState) ? options.saveOnlyChangedState : _.isBoolean(this.__saveOnlyChangedState) ? this.__saveOnlyChangedState : true;
          if (isSaveOperation(method)) {
            options.attrs = saveOnlyChanged ? calcSaveableAttributes.call(this) : this.toJSON();
          }
        }
        if (!silent && this.isStateDirty() && isSaveOperation(method)) {
          this.trigger("before:state:save", this);
          const cb = () => {
            this.stopListening(this, "state:dirty state:clean", cb);
            this.trigger(this.isStateDirty() ? "state:save:error" : "state:save", this);
          };
          this.listenToOnce(this, "state:dirty state:clean", cb);
        }
        return oSync.call(this, method, model, options);
      }
    });
    return prototype;
  }
};

export default StatefulModelMixin;