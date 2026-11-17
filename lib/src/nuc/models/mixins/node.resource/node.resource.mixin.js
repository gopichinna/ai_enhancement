/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/models/mixins/node.connectable/node.connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/node.autofetchable/node.autofetchable.mixin'
], function (_, NodeConnectableMixin, FetchableMixin, NodeAutoFetchableMixin) {
  var NodeResourceMixin = {
    mixin: function (prototype) {
      NodeConnectableMixin.mixin(prototype);
      FetchableMixin.mixin(prototype);
      NodeAutoFetchableMixin.mixin(prototype);

      return _.extend(prototype, {
        makeNodeResource: function (options) {
          return this.makeNodeConnectable(options).makeFetchable(options).makeNodeAutoFetchable(options);
        }
      });
    }
  };

  return NodeResourceMixin;
});
