/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import ConnectableMixin from "nuc/models/mixins/connectable/connectable.mixin";

import FetchableMixin from "nuc/models/mixins/fetchable/fetchable.mixin";

const ResourceMixin = {
  mixin: function(prototype) {
    ConnectableMixin.mixin(prototype);
    FetchableMixin.mixin(prototype);
    _.extend(prototype, {
      makeResource: function(options) {
        return this.makeConnectable(options).makeFetchable(options);
      }
    });
  }
};

export default ResourceMixin;