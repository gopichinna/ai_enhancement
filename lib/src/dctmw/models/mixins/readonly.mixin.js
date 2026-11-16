/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const idMap = new Map();

const ReadonlyMixin = {
  mixin(prototype) {
    const originalSync = prototype.sync;
    Object.assign(prototype, {
      makeReadonly() {
        idMap.set(this.cid, true);
        this.once("destroy", () => {
          idMap.delete(this.cid);
        });
        return this;
      },
      sync(method, model, options) {
        if (idMap.get(this.cid) && method !== "read") {
          throw new Error(`${this.constructor.name} is marked read-only, it can only be fetched.`);
        }
        return originalSync.call(this, method, model, options);
      }
    });
    return prototype;
  }
};

export default ReadonlyMixin;