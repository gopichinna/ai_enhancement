/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/models/actions',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/v2.commandable/v2.commandable.mixin',
  'nuc/models/node.actions/server.adaptor.mixin'
], function (_, Backbone, ActionCollection, ConnectableMixin, FetchableMixin, CommandableMixin, ServerAdaptorMixin) {
  'use strict';

  var NodeActionModel = Backbone.Model.extend({
    constructor: function NodeActionModel(attributes, _options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.actions = new ActionCollection(attributes && attributes.actions);
    }
  });

  var NodeActionCollection = Backbone.Collection.extend({
    model: NodeActionModel,

    constructor: function NodeActionCollection(_attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      var nodes = options && options.nodes;
      if (typeof nodes === 'string') {
        nodes = nodes.split(',');
      }
      this.nodes = nodes || [];
      !!options.reference_id && (this.reference_id = options.reference_id);

      this.makeConnectable(options).makeFetchable(options).makeCommandableV2(options).makeServerAdaptor(options);
    },

    setNodes: function (nodes) {
      if (!_.isArray(nodes)) {
        nodes = nodes.split(',');
      }
      _.each(
        nodes,
        function (node) {
          if (!_.contains(this.nodes, node)) {
            this.nodes.push(node);
          }
        },
        this
      );
    },

    resetNodes: function (nodes) {
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = nodes.split(',');
        }
        _.each(
          nodes,
          function (node) {
            var index = _.indexOf(this.nodes, node);
            if (index >= 0) {
              this.nodes.splice(index, 1);
            }
          },
          this
        );
      } else {
        this.nodes = [];
      }
    },

    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        nodes: _.clone(this.nodes),
        commands: _.clone(this.includeCommands)
      });
    }
  });

  ConnectableMixin.mixin(NodeActionCollection.prototype);
  FetchableMixin.mixin(NodeActionCollection.prototype);
  CommandableMixin.mixin(NodeActionCollection.prototype);
  ServerAdaptorMixin.mixin(NodeActionCollection.prototype);

  return NodeActionCollection;
});
