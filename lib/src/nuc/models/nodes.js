/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
/**
 * @export
 */
define([
  'nuc/lib/backbone',
  'nuc/models/node/node.model',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin'
], function (Backbone, NodeModel, DelayedCommandableV2Mixin) {
  /**
   * @class NodeCollection
   * @extends Backbone.Collection
   * @mixes DelayedCommandableV2Mixin
   */
  var Nodes = Backbone.Collection.extend(
    /** @lends NodeCollection.prototype */ {
      /**
       * @member
       * @type NodeModel
       */
      model: NodeModel,

      /**
       * @constructs
       * @param models
       * @param options
       */
      constructor: function Nodes(_models, options) {
        options || (options = {});
        Backbone.Collection.prototype.constructor.apply(this, arguments);
        this.makeDelayedCommandableV2(options);
      },

      /**
       * @function
       * @param enable
       */
      automateFetch: function (_enable) {}
    }
  );
  DelayedCommandableV2Mixin.mixin(Nodes.prototype);
  Nodes.version = '1.0';

  return Nodes;
});
