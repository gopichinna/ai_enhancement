/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ActionItems from "nuc/models/actionitems";

import ImmutableMixin from "dctmw/models/mixins/immutable.mixin";

class ImmutableActionItems extends ActionItems {
  constructor(models, options = {}) {
    options.throwImmutableModificationError = true;
    super(models, options);
    this.makeImmutable(options);
  }
}

ImmutableMixin.mixin(ImmutableActionItems.prototype);

Object.defineProperty(ImmutableActionItems.prototype.constructor, "name", {
  value: "ImmutableActionItems"
});

const defaultActionItems = new ImmutableActionItems([ {
  signature: "D4-Open",
  sequence: Number.MIN_VALUE
} ]);

export default defaultActionItems;