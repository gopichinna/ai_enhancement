/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/models/nodes',
  'nuc/models/nodechildrencolumns',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
  'nuc/models/node.children/server.adaptor.mixin',
  'nuc/utils/deepClone/deepClone'
], function (
  module,
  _,
  NodeCollection,
  NodeChildrenColumnCollection,
  NodeResourceMixin,
  ExpandableMixin,
  BrowsableMixin,
  DelayedCommandableMixin,
  ServerAdaptorMixin
) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  /**
   * @class NodeChildrenCollection
   * @augments NodeCollection
   * @param models
   * @param options
   * @mixes BrowsableMixin
   * @mixes ExpandableMixin
   * @mixes DelayedCommandableMixin
   * @mixes ServerAdaptorMixin
   * @mixes NodeResourceMixin
   *


   */
  var NodeChildrenCollection = NodeCollection.extend(
    /** @lends NodeChildrenCollection.prototype */ {
      constructor: function NodeChildrenCollection(models, options) {
        options = _.defaults(
          {},
          options,
          {
            top: config.defaultPageSize,
            columnsFromDefinitionsOrder: false
          },
          options
        );

        NodeCollection.prototype.constructor.call(this, models, options);

        this.makeNodeResource(options)
          .makeExpandable(options)
          .makeDelayedCommandable(options)
          .makeBrowsable(options)
          .makeServerAdaptor(options);

        this.options = options;
        this.includeActions = options.includeActions;
        this.columns = new NodeChildrenColumnCollection();
      },

      /**
       * @function
       * @returns {NodeChildrenCollection}
       */
      clone: function () {
        return new this.constructor(this.models, {
          node: this.node,
          skip: this.skipCount,
          top: this.topCount,
          filter: _.deepClone(this.filters),
          orderBy: this.orderBy,
          expand: _.clone(this.expand),
          includeActions: this.includeActions,
          commands: _.clone(this.includeCommands),
          defaultActionCommands: _.clone(this.defaultActionCommands),
          delayRestCommands: this.delayRestCommands
        });
      },

      /**
       * @function
       * @returns boolean
       */
      isFetchable: function () {
        return this.node.isFetchable();
      }
    }
  );

  BrowsableMixin.mixin(NodeChildrenCollection.prototype);
  ExpandableMixin.mixin(NodeChildrenCollection.prototype);
  DelayedCommandableMixin.mixin(NodeChildrenCollection.prototype);
  ServerAdaptorMixin.mixin(NodeChildrenCollection.prototype);
  NodeResourceMixin.mixin(NodeChildrenCollection.prototype);

  // TODO: Remove this, as soon as all abandoned this.Fetchable.
  var originalFetch = NodeChildrenCollection.prototype.fetch;
  NodeChildrenCollection.prototype.Fetchable = {
    fetch: function (options) {
      // log.warn('Using this.Fetchable.fetch has been deprecated.  ' +
      //          'Use NodeChildrenCollection.prototype.fetch. ' +
      //          'this.Fetchable is going to be removed.') && console.warn(log.last);
      // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
      return originalFetch.call(this, options);
    }
  };

  return NodeChildrenCollection;
});
