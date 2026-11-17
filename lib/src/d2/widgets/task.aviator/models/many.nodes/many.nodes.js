/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  clone
} from "nuc/lib/underscore";

import deepClone from "nuc/utils/deepClone/deepClone";

import {
  Collection
} from "nuc/lib/backbone";

import NodeModel from "nuc/models/node/node.model";

import ResourceMixin from "nuc/models/mixins/resource/resource.mixin";

import AdditionalResourcesV2Mixin from "nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin";

import FieldsV2Mixin from "nuc/models/mixins/v2.fields/v2.fields.mixin";

import ExpandableV2Mixin from "nuc/models/mixins/v2.expandable/v2.expandable.mixin";

import StateRequestorMixin from "nuc/models/mixins/state.requestor/state.requestor.mixin";

import DelayedCommandableV2Mixin from "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin";

import ServerAdaptorMixin from "d2/widgets/task.aviator/server.adaptors/chat.reference.nodes.mixin";

class ManyNodesCollection extends Collection {
  constructor(models, options) {
    super(models, options);
    this.makeResource(options).makeAdditionalResourcesV2Mixin(options).makeFieldsV2(options).makeExpandableV2(options).makeStateRequestor(options).makeDelayedCommandableV2(options).makeServerAdaptor(options);
    this.ids = options?.ids || [];
  }
  clone() {
    const model = new this.constructor(this.models, {
      connector: this.connector,
      fields: deepClone(this.fields),
      expand: deepClone(this.expand),
      includeResources: clone(this._additionalResources),
      commands: clone(this.commands),
      defaultActionCommands: clone(this.defaultActionCommands),
      delayRestCommands: this.delayRestCommands,
      autofetch: this.autofetch,
      autofetchEvent: this._autofetchEvent,
      autoreset: this.autoreset
    });
    model.fetched = this.fetched;
    model.error = this.error;
    return model;
  }
}

Object.assign(ManyNodesCollection.prototype, {
  model: NodeModel
});

Object.defineProperty(ManyNodesCollection.prototype.constructor, "name", {
  value: "ManyNodesCollection"
});

AdditionalResourcesV2Mixin.mixin(ManyNodesCollection.prototype);

FieldsV2Mixin.mixin(ManyNodesCollection.prototype);

ExpandableV2Mixin.mixin(ManyNodesCollection.prototype);

StateRequestorMixin.mixin(ManyNodesCollection.prototype);

DelayedCommandableV2Mixin.mixin(ManyNodesCollection.prototype);

ResourceMixin.mixin(ManyNodesCollection.prototype);

ServerAdaptorMixin.mixin(ManyNodesCollection.prototype);

ManyNodesCollection.prototype.isFetchable = function isFetchable() {
  return !!this.ids.length;
};

export default ManyNodesCollection;