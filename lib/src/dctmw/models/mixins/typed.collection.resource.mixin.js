/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import CommandableMixin from "dctmw/models/mixins/commandable.mixin";

import TypedBaseMixin from "dctmw/models/mixins/typed.base.mixin";

import BrowsableTypedCollectionMixin from "dctmw/models/mixins/browsable.typed.collection.mixin";

const TypedCollectionResourceMixin = {
  mixin(prototype) {
    ResourceMixin.mixin(prototype);
    CommandableMixin.mixin(prototype);
    TypedBaseMixin.mixin(prototype);
    BrowsableTypedCollectionMixin.mixin(prototype);
    Object.assign(prototype, {
      makeTypedCollectionResource(options = {}) {
        this.options ??= options;
        return this.makeResource(options).makeCommandable(options).makeTyped(options).makeBrowsableCollection(options);
      }
    });
    return prototype;
  }
};

export default TypedCollectionResourceMixin;