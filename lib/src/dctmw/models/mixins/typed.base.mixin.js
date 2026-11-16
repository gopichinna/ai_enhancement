/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import utils from "dctmw/utils/utils";

const TypedBaseMixin = {
  mixin(prototype) {
    Object.assign(prototype, {
      makeTyped(options = {}) {
        options.dataType ??= this.constructor.DATA_TYPE;
        if (utils.isNonEmptyString(options.dataType)) {
          this.dataType = options.dataType;
        }
        if (!utils.isNonEmptyString(this.dataType)) {
          throw new Error(`${this.constructor.name} cannot be instantiated without a type. Define 'DATA_TYPE' statically or 'dataType' at prototype or in constructor options`);
        }
        return this;
      }
    });
    return prototype;
  }
};

export default TypedBaseMixin;