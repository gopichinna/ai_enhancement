/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/models/node.actions',
  'nuc/models/mixins/commandable/commandable.mixin',
  'nuc/utils/deepClone/deepClone'
], function (_, Backbone, NodeActionCollection, CommandableMixin) {
  'use strict';

  var DelayedCommandableMixin = {
    mixin: function (prototype) {
      CommandableMixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      return _.extend(prototype, {
        makeDelayedCommandable: function (options) {
          options || (options = {});
          var defaultActionCommands = options.defaultActionCommands;
          if (typeof defaultActionCommands === 'string') {
            defaultActionCommands = defaultActionCommands.split(',');
          }
          this.defaultActionCommands = defaultActionCommands || [];

          this.delayedActions = new NodeActionCollection(undefined, {
            connector: options.connector
          });

          this.delayRestCommands = options.delayRestCommands;
          if (this.delayRestCommands) {
            this.on('sync', this._requestRestActions);
          }

          this.delayRestCommandsForModels = options.delayRestCommandsForModels;

          return this.makeCommandable(options);
        },

        _requestRestActions: function (model) {
          // Guard against propagated sync event: if this mixin has been
          // applied to a collection, only fetch of the collection should
          // be handled here; fetching of models should not re-fetch actions
          // for the whole collection.
          // Also do nothing if the collection is empty.
          if (model !== this || (this instanceof Backbone.Collection && !this.length)) {
            return;
          }
          var defaultActionCommands = this.defaultActionCommands,
            restCommands = _.reject(this.includeCommands, function (command) {
              return _.contains(defaultActionCommands, command);
            });
          if (restCommands.length) {
            var delayedActions = this.delayedActions;
            delayedActions.resetCommands();
            delayedActions.setCommands(restCommands);
            delayedActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              delayedActions.setNodes(this.pluck('id'));
            } else {
              delayedActions.setNodes([this.get('id')]);
            }
            if (!delayedActions.connector) {
              this.connector.assignTo(delayedActions);
            }
            delayedActions.parent_id = this.node ? this.node.get('id') : this.get('id');
            delayedActions.fetch({
              reset: true,
              // Update the actions as soon as possible; event
              // and promise can be watched by someone else
              success: _.bind(this._updateOriginalActions, this)
            });
          }
        },

        _updateOriginalActions: function () {
          var delayedActions = this.delayedActions;

          function updateNodeActions(node) {
            var actionNode = delayedActions.get(node.get('id'));
            if (actionNode) {
              node.actions.add(actionNode.actions.models);
            }
          }

          if (this instanceof Backbone.Collection) {
            this.each(updateNodeActions);
          } else {
            updateNodeActions(this);
          }
        },

        setDefaultActionCommands: function (name) {
          if (!_.isArray(name)) {
            name = name.split(',');
          }
          _.each(
            name,
            function (name) {
              if (!_.contains(this.defaultActionCommands, name)) {
                this.defaultActionCommands.push(name);
              }
            },
            this
          );
        },

        resetDefaultActionCommands: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(',');
            }
            _.each(
              name,
              function (name) {
                var index = _.indexOf(this.defaultActionCommands, name);
                if (index >= 0) {
                  this.defaultActionCommands.splice(index, 1);
                }
              },
              this
            );
          } else {
            this.defaultActionCommands.splice(0, this.defaultActionCommands.length);
          }
        },

        getRequestedCommandsUrlQuery: function () {
          var commands = this.delayRestCommands ? this.defaultActionCommands : this.includeCommands;
          return commands.length && { commands: commands };
        },

        getAllCommandsUrlQuery: function () {
          var commands = this.includeCommands;
          return commands.length && { commands: commands };
        },

        // Stop the delayed action enabling for child models and collections.
        // If they want it, they can do so in the constructors, which creates
        // them. Immediate child models of this collection can be enabled by
        // the delayRestCommandsForModels option.
        _prepareModel: function (attrs, options) {
          var delayRestCommands, delayRestCommandsForModels;
          options || (options = {});
          // If the collection is populated after the constructor has
          // finished, we can use parameters passed to the constructor
          // as defaults, if the population options are empty.
          if (this.delayedActions) {
            delayRestCommands = options.delayRestCommands;
            if (delayRestCommands === undefined) {
              delayRestCommands = this.delayRestCommands;
            }
            delayRestCommandsForModels = options.delayRestCommandsForModels;
            if (delayRestCommandsForModels === undefined) {
              delayRestCommandsForModels = this.delayRestCommandsForModels;
            }
          } else {
            delayRestCommands = options.delayRestCommands;
            delayRestCommandsForModels = options.delayRestCommandsForModels;
          }
          options.delayRestCommands = delayRestCommandsForModels;
          options.delayRestCommandsForModels = false;
          var model = originalPrepareModel.call(this, attrs, options);
          options.delayRestCommands = delayRestCommands;
          options.delayRestCommandsForModels = delayRestCommandsForModels;
          return model;
        }
      });
    }
  };

  return DelayedCommandableMixin;
});
