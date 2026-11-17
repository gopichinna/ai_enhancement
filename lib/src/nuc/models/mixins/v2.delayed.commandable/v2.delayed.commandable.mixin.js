/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/backbone',
  'nuc/models/node.actions',
  'nuc/models/mixins/v2.commandable/v2.commandable.mixin',
  // TODO: Remove this module as soon as the actions are passed only via
  /// module constructors.
  'nuc/utils/promoted.actionitems',
  'nuc/utils/deepClone/deepClone'
], function (_, $, Backbone, NodeActionCollection, CommandableV2Mixin, promotedActionItems) {
  'use strict';

  var DelayedCommandableV2Mixin = {
    mixin: function (prototype) {
      CommandableV2Mixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      return _.extend(
        prototype,
        /** @lends DelayedCommandableV2Mixin# */ {
          /**
         * @name DelayedCommandableV2Mixin
         * @mixin
         * @type {{mixin: (function(*=): *)}}
         * @description Provides support for fetching permitted actions by an extra call after
         the primary node model or collection has been fetched.
         It depends on setting
         the `actions` URL query parameter as introduced by the `api/v2/nodes/:id` (V2)
         resource to specify just the default actions. After the main call has finished,
         an additional `api/v2/actions/nodes` call will be issued to enquire about the
         rest of the actions.
         Server responses can contain *permitted actions* to be able to support
         enabling and disabling in the corresponding UI; how many and which ones
         should be checked by the server, it can be specified.
         */

          /**
           * @function
           * @param options
           * @returns {*}
           */
          makeDelayedCommandableV2: function (options) {
            options || (options = {});
            var defaultActionCommands = options.defaultActionCommands;
            var promotedActionCommands =
              options.promotedActionCommands || promotedActionItems.getPromotedCommandsSignatures();
            var nonPromotedActionCommands = options.nonPromotedActionCommands || [];
            var nonPromotedActionsOptions = options.nonPromotedActionsOptions || {};
            var delayedActionsOptions = options.delayedActionsOptions || {};
            var additionalActionsOptions = options.additionalActionsOptions || {};
            if (typeof defaultActionCommands === 'string') {
              defaultActionCommands = defaultActionCommands.split(',');
            }
            this.defaultActionCommands = defaultActionCommands || [];
            this.promotedActionCommands = promotedActionCommands;
            this.nonPromotedActionCommands = nonPromotedActionCommands || [];
            this.nonPromotedActionsOptions = nonPromotedActionsOptions;
            this.delayedActionsOptions = delayedActionsOptions;
            this.additionalActionsOptions = additionalActionsOptions;

            this.delayedActions = this.createDelayedActions();
            this.additionalActions = this.createAdditionalActions();

            this.setEnabledDelayRestCommands(options.delayRestCommands, options.promoteSomeRestCommands);

            this.delayRestCommandsForModels = options.delayRestCommandsForModels;

            this.promotedActionItemsFromControler = promotedActionItems;

            return this.makeCommandableV2(options);
          },

          /**
         * @function
         * @param enable
         * @param promoted
         * @description Enables or disables the delayed command fetching and promoted actions. The current
         state can be seen by `delayRestCommands` and `promoteSomeRestCommands` properties.
         */
          setEnabledDelayRestCommands: function (enable, promoted) {
            if (enable) {
              this._enableDelayRestCommands();
            } else {
              this._disableDelayRestCommands();
            }
            this.promoteSomeRestCommands = promoted !== false;
          },

          /** @function
           *
           * @param enable
           * @returns {*|jQuery}
           */
          setEnabledLazyActionCommands: function (enable) {
            var deferred = $.Deferred();
            if (enable) {
              this._enableNonPromotedRestCommands();
              this._requestsNonPromotedRestActions()
                .done(function (node) {
                  deferred.resolve(node);
                })
                .fail(function (error) {
                  deferred.reject(error);
                });
            } else {
              this._disableNonPromotedRestCommands();
            }
            return deferred.promise();
          },

          /**
           * @function
           * @param signatures
           * @param retrievedFlagOnNode
           * @returns {*|jQuery}
           * @description Use this method if your module needs to retrieve additional actions.
           */
          getAdditionalActionCommands: function (signatures, retrievedFlagOnNode) {
            var deferred = $.Deferred();
            this._requestAdditionalActions(signatures, retrievedFlagOnNode)
              .done(
                _.bind(function (node) {
                  deferred.resolve(node);
                }, this)
              )
              .fail(function (error) {
                deferred.reject(error);
              });
            return deferred.promise();
          },

          /**
           * @function
           * @private
           */
          _enableDelayRestCommands: function () {
            if (!this.delayRestCommands) {
              this.delayRestCommands = true;
              this.on('sync', this._requestRestActions, this);
            }
          },

          /**
           * @function
           * @private
           */
          _disableDelayRestCommands: function () {
            if (this.delayRestCommands) {
              this.delayRestCommands = false;
              this.off('sync', this._requestRestActions, this);
            }
          },

          _enableNonPromotedRestCommands: function () {
            if (!this.enableNonPromotedCommands) {
              this.enableNonPromotedCommands = true;
              this.on('sync', this._requestsNonPromotedRestActions, this);
            }
          },

          _disableNonPromotedRestCommands: function () {
            this.enableNonPromotedCommands = false;
            this.off('sync', this._requestsNonPromotedRestActions, this);
          },

          _requestRestActions: function (model, resp, options) {
            // Guard against propagated sync event: if this mixin has been
            // applied to a collection, only fetch of the collection should
            // be handled here; fetching of models should not re-fetch actions
            // for the whole collection.
            // Also do nothing if the collection is empty.
            if (model !== this || (this instanceof Backbone.Collection && !this.length)) {
              return;
            }
            // request delayed actions only when fetching (POST is also used for fetching)
            if (options.xhr && options.xhr.settings.type !== 'GET' && options.xhr.settings.type !== 'POST') {
              return;
            }
            if (this.promoteSomeRestCommands) {
              this._requestPromotedActions(model, resp, options);
            } else {
              this._requestDelayedActions(model, resp, options);
            }
          },

          _requestDelayedActions: function () {
            var defaultActionCommands = this.defaultActionCommands;
            var restCommands = _.reject(this.commands, function (command) {
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
              const collectionClone = tryCloneCollection(this);
              delayedActions.fetch({
                // Update the actions by the success callback to make it happen
                // earlier than event and promise handlers.
                success: () => this._updateOriginalActions(collectionClone),
                reset: true
              });
            }
          },

          _requestPromotedActions: function (model) {
            var defaultActionCommands = this.defaultActionCommands,
              promotedActionCommands = this.promotedActionCommands;

            //NonPromotedActionCommands = allCommands - defaultActionCommnads - promotedActionCommands
            //DelayActions = (allCommands - defaultActionCommnads) Intersect promotedActionCommands;
            var restCommands = _.reject(this.commands, function (command) {
                return _.contains(defaultActionCommands, command);
              }),
              promotedCommands = [],
              nonPromotedCommands = [];
            _.each(restCommands, function (command) {
              if (_.contains(promotedActionCommands, command)) {
                //CurrentPromotedActions
                promotedCommands.push(command); // Delay Commands
              } else {
                nonPromotedCommands.push(command); // nonpromoted Commands
              }
            });

            this.promotedActionCommands = promotedCommands;
            this.nonPromotedActionCommands = nonPromotedCommands;
            ///remove other commands which are not declared in toolbarItems
            if (promotedCommands.length) {
              var delayedActions = this.delayedActions;
              delayedActions.resetCommands();
              delayedActions.setCommands(promotedCommands);
              delayedActions.resetNodes();
              if (this instanceof Backbone.Collection) {
                var restNodes = [];
                this.each(function (model) {
                  //update node model with promoted and nonpromoted commands list, Since we are
                  // not fetching every node info individually
                  model.nonPromotedActionCommands = nonPromotedCommands;
                  model.promotedActionCommands = promotedCommands;
                  if (!model.get('csuiDelayedActionsRetrieved')) {
                    restNodes.push(model.get('id'));
                  }
                });
                delayedActions.setNodes(restNodes);
              } else {
                model.nonPromotedActionCommands = nonPromotedCommands;
                model.promotedActionCommands = promotedCommands;
                delayedActions.setNodes([this.get('id')]);
              }
              delayedActions.parent_id = this.node ? this.node.get('id') : this.get('id');
              if (delayedActions.nodes.length > 0) {
                if (!delayedActions.connector) {
                  this.connector.assignTo(delayedActions);
                }
                const collectionClone = tryCloneCollection(this);
                delayedActions.fetch({
                  // Update the actions by the success callback to make it happen
                  // earlier than event and promise handlers.
                  success: () => this._updateOriginalActions(collectionClone),
                  reset: true
                });
              }
            } else {
              //update node with promoted and non-promoted commands list If there are no promoted
              // commands
              if (this instanceof Backbone.Collection) {
                this.each(function (model) {
                  model.nonPromotedActionCommands = nonPromotedCommands;
                  model.promotedActionCommands = promotedCommands;
                });
              } else {
                model.nonPromotedActionCommands = nonPromotedCommands;
                model.promotedActionCommands = promotedCommands;
              }
            }
          },

          setNonPromotedActionsOptions: function (options) {
            _.extend(this.nonPromotedActionsOptions, options);
          },

          resetNonPromotedActionsOptions: function (properties) {
            if (properties) {
              if (!_.isArray(properties)) {
                properties = properties.split(',');
              }
              this.nonPromotedActionsOptions = _.omit(this.nonPromotedActionsOptions, properties);
            } else {
              this.nonPromotedActionsOptions = {};
            }
          },

          _requestsNonPromotedRestActions: function () {
            var deferred = $.Deferred();
            var nonPromotedActions = this.createNonPromotedActionsOptions(),
              nonPromotedActionCommands = this.nonPromotedActionCommands.length
                ? this.nonPromotedActionCommands
                : this.collection.nonPromotedActionCommands;
            nonPromotedActions.resetCommands();
            nonPromotedActions.setCommands(nonPromotedActionCommands);
            nonPromotedActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              var restNodes = [];
              this.each(function (model) {
                if (!model.get('csuiLazyActionsRetrieved') && !model.isLocallyCreated) {
                  restNodes.push(model.get('id'));
                }
              });
              nonPromotedActions.parent_id = this.length && this.models[0].get('reference_id');
              nonPromotedActions.setNodes(restNodes);
            } else {
              nonPromotedActions.setNodes([this.get('id')]);
              nonPromotedActions.parent_id = this.get('reference_id');
            }

            if (!nonPromotedActions.connector) {
              this.connector.assignTo(nonPromotedActions);
            }
            if (nonPromotedActions.commands.length && nonPromotedActions.nodes.length) {
              const collectionClone = tryCloneCollection(this);
              nonPromotedActions.fetch({
                // Update the actions by the success callback to make it happen
                // earlier than event and promise handlers.
                success: () => {
                  this._updateOriginalActionsAfterLazyActions(collectionClone, nonPromotedActions);
                  deferred.resolve(this);
                },
                error: error => {
                  if (this instanceof Backbone.Collection) {
                    this.each(model => {
                      if (nonPromotedActions.nodes.includes(model.get('id'))) {
                        model.attributes.csuiLazyActionsRetrieved = false;
                      }
                    });
                  } else {
                    this.attributes.csuiLazyActionsRetrieved = false;
                  }
                  deferred.reject(error);
                },
                reset: true
              });
            } else {
              if (this instanceof Backbone.Collection) {
                this.each(function (model) {
                  model.set('csuiLazyActionsRetrieved', true);
                });
              } else {
                this.set('csuiLazyActionsRetrieved', true);
              }
              deferred.resolve(this);
            }
            return deferred.promise();
          },

          _requestAdditionalActions: function (signatures, retrievedFlagOnNode) {
            var deferred = $.Deferred();
            var additionalActions = this.additionalActions;
            additionalActions.resetCommands();
            additionalActions.setCommands(signatures);
            additionalActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              var restNodes = [];
              this.each(function (model) {
                if (!model.get(retrievedFlagOnNode) && !model.isLocallyCreated) {
                  restNodes.push(model.get('id'));
                }
              });
              additionalActions.parent_id = this.length && this.models[0].get('reference_id');
              additionalActions.setNodes(restNodes);
            } else {
              additionalActions.setNodes([this.get('id')]);
              additionalActions.parent_id = this.get('reference_id');
            }

            if (!additionalActions.connector) {
              this.connector.assignTo(additionalActions);
            }
            if (additionalActions.commands.length && additionalActions.nodes.length) {
              const collectionClone = tryCloneCollection(this);
              additionalActions.fetch({
                // Update the actions by the success callback to make it happen
                // earlier than event and promise handlers.
                success: () => {
                  this._updateOriginalActionsAfterAdditionalActions(collectionClone, retrievedFlagOnNode);
                  deferred.resolve(this);
                },
                error: error => {
                  this.attributes[retrievedFlagOnNode] = false;
                  deferred.reject(error);
                },
                reset: true
              });
            } else {
              if (this instanceof Backbone.Collection) {
                this.each(function (model) {
                  model.set(retrievedFlagOnNode, true);
                });
              } else {
                this.set(retrievedFlagOnNode, true);
              }
              deferred.resolve(this);
            }
            return deferred.promise();
          },

          _updateOriginalActions: function (targetModels) {
            var delayedActions = this.delayedActions;
            let updated;

            function updateNodeActions(node) {
              var actionNode = delayedActions.get(node.get('id'));
              if (actionNode) {
                // Trigger the event on the node first.
                node.trigger('before:update:actions', {
                  target: node,
                  node: node,
                  newActions: actionNode.actions
                });
                // If the node is part of a collection, trigger the event on the collection as well.
                if (node.collection) {
                  node.collection.trigger('before:update:actions', {
                    target: this,
                    node: node,
                    newActions: actionNode.actions
                  });
                }
                node.actions.add(actionNode.actions.models);
                node.set('csuiDelayedActionsRetrieved', true);
                updated = true;
              }
            }

            // If targetModes are defined, the mixin was applied to a collection,
            // with the models remembered by the targetModels slice before fetching
            // the actions. Otherwise the mixin was applied to a model.
            if (targetModels) {
              targetModels.forEach(updateNodeActions.bind(this));
              if (updated) {
                // If the mixin is applied to a collection, all models are
                // expected to be in the same collection.
                this.trigger('update:actions:delayed', {
                  target: this,
                  newActions: delayedActions
                });
                this.trigger('update:actions', {
                  target: this,
                  newActions: delayedActions
                });
              }
            } else {
              updateNodeActions.call(this, this);
              if (updated) {
                this.trigger('update:actions:delayed', {
                  target: this,
                  node: this,
                  newActions: delayedActions
                });
                this.trigger('update:actions', {
                  target: this,
                  node: this,
                  newActions: delayedActions
                });
              }
            }
          },

          _updateOriginalActionsAfterLazyActions: function (targetModels, nonPromotedActions) {
            let updated, updatedCollection;
            var updateNodeActions = function (node) {
              var actionNode = nonPromotedActions.get(node.get('id'));
              if (_.contains(nonPromotedActions.nodes, node.get('id'))) {
                node.attributes.csuiLazyActionsRetrieved = true;
              }
              if (actionNode) {
                _.each(actionNode.actions.models, function (action) {
                  action.attributes.csuiNonPromotedAction = true;
                });
                node.actions.add(actionNode.actions.models);
                updated = true;
                // If the mixin is applied to a collection, all models are
                // expected to be in the same collection.
                updatedCollection = node.collection;
              }
            };

            // If targetModes are defined, the mixin was applied to a collection,
            // with the models remembered by the targetModels slice before fetching
            // the actions. Otherwise the mixin was applied to a model.
            if (targetModels) {
              targetModels.forEach(updateNodeActions.bind(this));
              if (updated && updatedCollection) {
                updatedCollection.trigger('update:actions:lazy', {
                  target: updatedCollection,
                  newActions: nonPromotedActions
                });
                updatedCollection.trigger('update:actions', {
                  target: updatedCollection,
                  newActions: nonPromotedActions
                });
              }
            } else {
              updateNodeActions(this);
              if (updated) {
                this.trigger('update:actions:lazy', {
                  target: updatedCollection,
                  node: this,
                  newActions: nonPromotedActions
                });
                this.trigger('update:actions', {
                  target: updatedCollection,
                  node: this,
                  newActions: nonPromotedActions
                });
              }
            }
          },

          _updateOriginalActionsAfterAdditionalActions: function (targetModels, retrievedFlagOnNode) {
            let updated, updatedCollection;
            var additionalActions = this.additionalActions,
              updateNodeActions = function (node) {
                node.attributes[retrievedFlagOnNode] = true;
                var actionNode = additionalActions.get(node.get('id'));
                if (actionNode) {
                  _.each(actionNode.actions.models, function (action) {
                    action.attributes.csuiNonPromotedAction = true;
                  });
                  node.actions.add(actionNode.actions.models);
                  updated = true;
                  // If the mixin is applied to a collection, all models are
                  // expected to be in the same collection.
                  updatedCollection = node.collection;
                }
              };

            // If targetModes are defined, the mixin was applied to a collection,
            // with the models remembered by the targetModels slice before fetching
            // the actions. Otherwise the mixin was applied to a model.
            if (targetModels) {
              targetModels.forEach(updateNodeActions);
              if (updated && updatedCollection) {
                updatedCollection.trigger('update:actions:additional', {
                  target: updatedCollection,
                  newActions: additionalActions
                });
                updatedCollection.trigger('update:actions', {
                  target: updatedCollection,
                  newActions: additionalActions
                });
              }
            } else {
              updateNodeActions(this);
              if (updated) {
                this.trigger('update:actions:additional', {
                  target: this,
                  node: this,
                  newActions: additionalActions
                });
                this.trigger('update:actions', {
                  target: this,
                  node: this,
                  newActions: additionalActions
                });
              }
            }
          },

          createNonPromotedActionsOptions: function () {
            return new NodeActionCollection(
              undefined,
              _.extend(
                {
                  isNonPromoted: true,
                  connector: this.connector
                },
                this.nonPromotedActionsOptions
              )
            );
          },

          createDelayedActions: function () {
            return new NodeActionCollection(
              undefined,
              _.extend(
                {
                  connector: this.connector
                },
                this.delayedActionsOptions
              )
            );
          },

          createAdditionalActions: function () {
            return new NodeActionCollection(
              undefined,
              _.extend(
                {
                  isNonPromoted: true,
                  connector: this.connector
                },
                this.additionalActionsOptions
              )
            );
          },

          /**
         * @function
         * @param {(string|string[])} name - The `name` parameter can be either string, or an array of strings.
         The string can contain a comma-delimited list, in which case it will be split
         to an array.  The rest of commands specified by the `setCommands` method
         will be fetched later by the second call.
         @description Asks for one or more commands to be checked immediately by the first server
         call.
```
 // Have two commands checked, option 1
 model.setCommands(['browse', 'download']);
 // Have two commands checked, option 2
 model.setCommands('browse');
 model.setCommands('download');
 // Have two commands checked, option 3
 model.setCommands('browse,download');
 ```
         */
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

          /**
         * @func
         * @description Prevents one or more commands from being checked immediatley by the first
         server call.
 ```
 // Have all commands fetched delayed by the second server call
 model.setCommands(['browse', 'download']);
 model.resetDefaultActionCommands();
 model.fetch();
 ```
         * @param {(string|string[])} name - The `names` parameter can be either string, or an array of
         strings, or nothing.  The string can contain a comma-delimited list, in
         which case it will be split to an array.  If nothing is specified, all
         commands will be removed (not to be checked by the first server call).
         */
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

          /**
         * @function
         * @returns {*|{actions: ({length}|Array|*)}}
         * @description Formats the URL query parameters for the command investigation.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.
         If delayed action fetching is enabled, only the default actions will be returned by this
         method; the rest of specified actions fill be fetched by an additional server call later.

```
var url = ...,
query = Url.combineQueryString(
  ...,
  this.getRequestedCommandsUrlQuery()
);
if (query) {
  url = Url.appendQuery(url, query);
}
```
         */
          getRequestedCommandsUrlQuery: function () {
            var commands = this.delayRestCommands ? this.defaultActionCommands : this.commands;
            return commands.length && { actions: commands };
          },

          /**
           * @function
           * @returns {*|{actions: ({length}|*)}}
           */
          getAllCommandsUrlQuery: function () {
            var commands = this.commands;
            return commands.length && { actions: commands };
          },

          // Stop the delayed action enabling for child models and collections.
          // If they want it, they can do so in the constructors, which creates
          // them. Immediate child models of this collection can be enabled by
          // the delayRestCommandsForModels option.
          _prepareModel: function (attrs, options) {
            var delayRestCommands, delayRestCommandsForModels, promoteSomeRestCommands;
            options || (options = {});
            // If the collection is populated after the constructor has
            // finished, we can use parameters passed to the constructor
            // as defaults, if the population options are empty.
            delayRestCommands = options.delayRestCommands;
            delayRestCommandsForModels = options.delayRestCommandsForModels;
            promoteSomeRestCommands = options.promoteSomeRestCommands;
            if (this.delayedActions) {
              if (delayRestCommands === undefined) {
                delayRestCommands = this.delayRestCommands;
              }
              if (delayRestCommandsForModels === undefined) {
                delayRestCommandsForModels = this.delayRestCommandsForModels;
              }
              if (promoteSomeRestCommands === undefined) {
                promoteSomeRestCommands = this.promoteSomeRestCommands;
              }
            }
            options.delayRestCommands = delayRestCommandsForModels;
            options.delayRestCommandsForModels = false;
            options.promoteSomeRestCommands = promoteSomeRestCommands;
            var model = originalPrepareModel.call(this, attrs, options);
            options.delayRestCommands = delayRestCommands;
            options.delayRestCommandsForModels = delayRestCommandsForModels;
            return model;
          }
        }
      );
    }
  };

  // Pass a slice of the current collection to the fetch success callback,
  // so that if the collection is modified before the actions are received,
  // the original models will be still available and actions will be inserted
  // to them. This is needed only if the mixin is applied to a collection.
  function tryCloneCollection(collection) {
    return collection instanceof Backbone.Collection ? collection.slice() : undefined;
  }

  return DelayedCommandableV2Mixin;
});
