/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model
} from "nuc/lib/backbone";

const idMap = new Map();

function getReqCloseMarkerSuccessEventNames() {
  return _.isFunction(this.hasDelayedDataBehavior) && this.hasDelayedDataBehavior() ? "delayed:data:sync delayed:data:skip" : "sync";
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
  this.stopListening(this, "update", updateListener).listenToOnce(this, getReqCloseMarkerSuccessEventNames.call(this), fnCloseMarkerSuccess).listenToOnce(this, getReqCloseMarkerErrorEventNames.call(this), fnCloseMarkerError);
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
  this.evaluateState(options);
  ifNotAlreadyListening.call(this, "update", updateListener) && this.listenTo(this, "update", updateListener);
}

function ifNotAlreadyListening(eName, callback) {
  const listeners = this._events[eName] || [];
  return !listeners.some(l => l.callback === callback);
}

function updateListener(col, opts) {
  const {
    changes: {
      added = [],
      removed = []
    }
  } = opts;
  const newlyAddedIds = getModelIds(added);
  const newlyRemovedIds = getModelIds(removed);
  const alreadyAddedIds = getModelIds(this.__scmAddedModels);
  const alreadyRemovedIds = getModelIds(this.__scmRemovedModels);
  newlyAddedIds.forEach((id, naix) => {
    const arix = alreadyRemovedIds.indexOf(id);
    if (arix !== -1) {
      alreadyRemovedIds.splice(arix, 1);
      this.__scmRemovedModels.splice(arix, 1);
      delete added[naix].isLocallyCreated;
    } else {
      const aaix = alreadyAddedIds.indexOf(id);
      if (aaix !== -1) {
        this.__scmAddedModels[aaix] = added[naix];
      } else {
        this.__scmAddedModels.push(added[naix]);
        alreadyAddedIds.push(id);
      }
    }
  });
  newlyRemovedIds.forEach((id, nrix) => {
    const aaix = alreadyAddedIds.indexOf(id);
    if (aaix !== -1) {
      alreadyAddedIds.splice(aaix, 1);
      this.__scmAddedModels.splice(aaix, 1);
    } else {
      const arix = alreadyRemovedIds.indexOf(id);
      if (arix !== -1) {
        this.__scmRemovedModels[arix] = removed[nrix];
      } else {
        this.__scmRemovedModels.push(removed[nrix]);
        alreadyRemovedIds.push(id);
      }
    }
  });
  this.evaluateState();
}

function captureState() {
  this.__serverModels = _.clone(this._scmGetServerModels());
}

function getModelIds(src = []) {
  return src.map(model => model.get(model.idAttribute ?? "id"));
}

function isSaveOperation(backboneMethod) {
  return backboneMethod === "update";
}

const StatefulCollectionMixin = {
  mixin(prototype) {
    const oSync = prototype.sync, oSet = prototype.set, oOnModelEvent = prototype._onModelEvent, oRemoveModels = prototype._removeModels, oRemove = prototype.remove;
    Object.assign(prototype, {
      trackState(options = {}) {
        this.__scmAddedModels = [];
        this.__scmRemovedModels = [];
        if (!idMap.has(this.cid)) {
          reqCloseListener.call(this, options);
          this.listenTo(this, "request", reqOpenListener);
        }
        return this;
      },
      stopTrackingState() {
        if (idMap.has(this.cid)) {
          this.stopListening(this, "request", reqOpenListener).stopListening(this, "update", updateListener);
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
        const isDirty = this.__scmAddedModels.length > 0 || this.__scmRemovedModels.length > 0;
        idMap.set(this.cid, isDirty);
        !silent && this.trigger(isDirty ? "state:dirty" : "state:clean", this);
      },
      resetToState(options = {}) {
        const {
          silent = false
        } = options;
        !silent && this.trigger("before:state:reset", this);
        this.stopTrackingState();
        const endOfReset = () => {
          this.trackState({
            silent: silent
          });
          !silent && this.trigger("state:reset", this);
        };
        const added = this.__scmAddedModels.splice(0, this.__scmAddedModels.length);
        const addedIds = getModelIds(added);
        const removed = this.__scmRemovedModels.splice(0, this.__scmRemovedModels.length);
        let sModels = this._scmGetServerModels().filter(m => !addedIds.includes(m.get(m.idAttribute ?? "id")));
        sModels = [ ...sModels, ...removed ];
        if (_.isFunction(this.makeClientSideBrowsable)) {
          this.populate(sModels, {
            parse: false,
            doNotCaptureState: true
          }).always(() => {
            endOfReset();
          });
        } else {
          this.reset(sModels, {
            silent: silent
          });
          endOfReset();
        }
      },
      sync(method, col, options = {}) {
        const {
          silent
        } = options;
        let modelsAdded = [ ...this.__scmAddedModels ];
        let modelsRemoved = [ ...this.__scmRemovedModels ];
        const restoreChangeOnFailure = isSaveOperation(method) || method === "read" && options.reload === true;
        if (restoreChangeOnFailure) {
          this.__scmAddedModels.splice(0, this.__scmAddedModels.length);
          this.__scmRemovedModels.splice(0, this.__scmRemovedModels.length);
        }
        options.modelsAdded = modelsAdded;
        options.modelsRemoved = modelsRemoved;
        if (!silent && this.isStateDirty() && isSaveOperation(method)) {
          this.trigger("before:State:save", this);
          const cb = evtSrc => {
            if (evtSrc === this) {
              this.stopListening(this, "state:dirty state:clean", cb);
              this.trigger(this.isStateDirty() ? "state:save:error" : "state:save", this);
            }
          };
          this.listenTo(this, "state:dirty state:clean", cb);
        }
        const retVal = oSync.call(this, method, col, options);
        retVal.fail(() => {
          Array.prototype.push.apply(this.__scmAddedModels, [ ...modelsAdded ]);
          Array.prototype.push.apply(this.__scmRemovedModels, [ ...modelsRemoved ]);
        });
        return retVal;
      },
      _scmGetServerModels() {
        return this.allModels ?? this.models;
      },
      _onModelEvent(event, model, collection, options) {
        if ([ "before:state:reset", "state:reset", "before:State:save", "state:save:error", "state:save" ].includes(event)) {
          return;
        }
        oOnModelEvent.call(this, event, model, collection, options);
      },
      _removeModels(models, options) {
        const removed = oRemoveModels.call(this, models, options);
        const removedIds = getModelIds(removed);
        if (removed.length !== models.length && _.isFunction(this.makeClientSideBrowsable)) {
          const remainingToRemove = models.filter(m => !removedIds.includes(m.get(m.idAttribute ?? "id")));
          remainingToRemove.forEach(m => {
            const id = m.get(m.idAttribute ?? "id");
            let model = this.get(m);
            if (!model) {
              const index = _.findIndex(this.allModels ?? [], mm => mm.get(mm.idAttribute ?? "id") === id);
              if (index >= 0) {
                model = this.allModels[index];
                this.allModels.splice(index, 1);
                --this.totalCount;
              }
            }
            if (!model) return;
            this._removeReference(model);
            if (!options.silent) {
              options.index = -1;
              model.trigger("remove", model, this, options);
            }
            removed.push(model);
          });
        }
        return removed;
      },
      remove(models, options) {
        const retVal = oRemove.call(this, models, options);
        if (_.isFunction(this.makeClientSideBrowsable)) {
          const skipC = this.skipCount || 0;
          const topC = this.topCount || 10;
          let currentPage = skipC / topC + 1;
          if (currentPage > 1) {
            if (!this.length || (currentPage - 1) * topC + this.length > this.totalCount) {
              while (currentPage > 1 && (currentPage - 1) * topC + this.length > this.totalCount) currentPage--;
              setTimeout(() => {
                delete this.skipCount;
                this._lastFilterAndSortCriteria = undefined;
                this.setSkip(Math.max(currentPage, 0) * topC);
              }, 0);
            }
          } else {
            setTimeout(() => {
              this.populate(this.allModels, {
                parse: false,
                doNotCaptureState: true
              });
            }, 0);
          }
        }
        return retVal;
      },
      set(models, options) {
        if (models == null) return;
        const serverIdList = getModelIds(this._scmGetServerModels());
        const addedIdList = getModelIds(this.__scmAddedModels);
        const localModels = _.isArray(models) ? models : [ models ];
        localModels.forEach(model => {
          if (model instanceof Model && model.isLocallyCreated) {
            const id = model.get(model.idAttribute ?? "id");
            if (serverIdList.includes(id) && !addedIdList.includes(id)) {
              delete model.isLocallyCreated;
            }
          }
        });
        return oSet.call(this, models, options);
      },
      isServerSidePaginated() {
        return false;
      }
    });
    return prototype;
  }
};

export default StatefulCollectionMixin;