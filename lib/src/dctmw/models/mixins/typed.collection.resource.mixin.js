/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import ConnectorFactory from "nuc/contexts/factories/connector";

import ResourceMixin from "dctmw/models/mixins/resource.mixin";

import CommandableMixin from "dctmw/models/mixins/commandable.mixin";

import TypedBaseMixin from "dctmw/models/mixins/typed.base.mixin";

import BrowsableTypedCollectionMixin from "dctmw/models/mixins/browsable.typed.collection.mixin";

import Session from "dctmw/utils/authenticators/session";

const TypedCollectionResourceMixin = {
  mixin(prototype) {
    TypedBaseMixin.mixin(prototype);
    BrowsableTypedCollectionMixin.mixin(prototype);
    CommandableMixin.mixin(prototype);
    ResourceMixin.mixin(prototype);
    Object.assign(prototype, {
      makeTypedCollectionResource(options = {}) {
        options.context ??= Session.get().getContext();
        options.connector ??= options.context.getObject(ConnectorFactory);
        this.options ??= options;
        return this.makeTyped(options).makeBrowsableCollection(options).makeCommandable(options).makeResource(options);
      }
    });
    return prototype;
  }
};

export default TypedCollectionResourceMixin;