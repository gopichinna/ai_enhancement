/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import {
  Model,
  Collection
} from "nuc/lib/backbone";

import logger from "nuc/utils/log";

const log = logger(module.id);

const idMap = new Map();

function _makeImmutable({
  throwImmutableModificationError = false
}) {
  idMap.set(this.cid, {
    throwImmutableModificationError: throwImmutableModificationError
  });
}

function _isImmutable() {
  const opts = idMap.get(this.cid);
  if (!opts) {
    return false;
  }
  const {
    throwImmutableModificationError
  } = opts;
  const logFragment = `${this.constructor.name}[cid=${this.cid}]`;
  if (throwImmutableModificationError !== false) {
    throw new Error(`Immutable object ${logFragment} can not be modified`);
  }
  log.warn(`Tried modifying immutable object ${logFragment}`) && console.warn(log.last);
  return true;
}

const ImmutableMixin = {
  mixin(prototype) {
    const isModel = prototype instanceof Model;
    const isCollection = prototype instanceof Collection;
    if (isModel) {
      const origSet = prototype.set, origUnset = prototype.unset, origClear = prototype.clear;
      Object.assign(prototype, {
        makeImmutable(options = {}) {
          _makeImmutable.call(this, options);
          return this;
        },
        set() {
          return !_isImmutable.call(this) && origSet.apply(this, arguments);
        },
        unset() {
          return !_isImmutable.call(this) && origUnset.apply(this, arguments);
        },
        clear() {
          return !_isImmutable.call(this) && origClear.apply(this, arguments);
        }
      });
    } else if (isCollection) {
      const origAdd = prototype.add, origRemove = prototype.remove, origReset = prototype.reset;
      Object.assign(prototype, {
        makeImmutable(options = {}) {
          _makeImmutable.call(this, options);
          return this;
        },
        add() {
          return !_isImmutable.call(this) && origAdd.apply(this, arguments);
        },
        remove() {
          return !_isImmutable.call(this) && origRemove.apply(this, arguments);
        },
        reset() {
          return !_isImmutable.call(this) && origReset.apply(this, arguments);
        }
      });
    }
    return prototype;
  }
};

export default ImmutableMixin;