/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const CommandableMixin = {
  mixin(prototype) {
    Object.assign(prototype, {
      makeCommandable(options = {}) {
        this.options ??= options;
        return this;
      }
    });
    return prototype;
  }
};

export default CommandableMixin;