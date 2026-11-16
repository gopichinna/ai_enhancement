/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import NodeModel from "nuc/models/node/node.model";

import ResourceMixin from "nuc/models/mixins/resource/resource.mixin";

import BrowsableMixin from "nuc/models/browsable/browsable.mixin";

import DelayedCommandableMixin from "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin";

import ServerAdaptorMixin from "dctmw/models/widgets/favorites/favorites.server.adaptor";

class FavoritesCollection extends Collection {
  constructor(models, options) {
    super(models, options);
    this.makeResource(options).makeBrowsable(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
  }
}

ResourceMixin.mixin(FavoritesCollection.prototype);

BrowsableMixin.mixin(FavoritesCollection.prototype);

DelayedCommandableMixin.mixin(FavoritesCollection.prototype);

ServerAdaptorMixin.mixin(FavoritesCollection.prototype);

Object.assign(FavoritesCollection.prototype, {
  model: NodeModel
});

Object.defineProperty(FavoritesCollection.prototype.constructor, "name", {
  value: "FavoritesCollection"
});

export default FavoritesCollection;