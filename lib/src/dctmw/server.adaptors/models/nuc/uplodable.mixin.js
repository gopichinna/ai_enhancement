/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const UplodableMixin = {
  mixin(prototype) {
    Object.assign(prototype, {
      makeUploadable() {
        return this;
      }
    });
    return prototype;
  }
};

export default UplodableMixin;