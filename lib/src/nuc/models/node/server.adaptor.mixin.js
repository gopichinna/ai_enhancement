/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/utils/url',
  'i18n!nuc/models/node/impl/nls/lang',
  'nuc/models/utils/v1tov2',
  'nuc/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'nuc/utils/deepClone/deepClone'
], function (require, _, $, Url, lang, v1tov2, SyncableFromMultipleSources) {
  'use strict';

  /** @class ServerAdaptorMixin
   * @mixin
   * @see ConnectableMixin
   * @description Overrides the methods of {@link https://backbonejs.org/#Model|Backbone.Model},
   * which are responsible for fetching and parsing data: url(), sync() and parse().
   * The overrides are Content Server specific.
   * ### How to apply the mixin to a model

   ```
   var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeAdditionalResourcesV2Mixin(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getAdditionalResourcesUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

   ConnectableMixin.mixin(MyModel.prototype);
   AdditionalResourcesV2Mixin.mixin(MyModel.prototype);
   ```

   This mixin us usually combined together with the `ConnectableMixin`
   or with another cumulated mixin which includes it.

   */
  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;
      SyncableFromMultipleSources.mixin(prototype);
      return _.extend(
        prototype,
        /** @lends ServerAdaptorMixin# */ {
          makeServerAdaptor: function (options) {
            this.fetchExactFields = options && options.fetchExactFields;
            return this;
          },

          /** @function
           *
           * @returns {boolean}
           */
          isFetchableDirectly: function () {
            return this.get('id') > 0;
          },

          // TODO: Remove this method and make the cache layer aware of node URLs.
          urlCacheBase: function () {
            var url = this.urlBase();
            if (url.indexOf('/volumes') < 0) {
              url = url.replace('/api/v1/', '/api/v2/');
            }
            return url + '?';
          },

          urlBase: function () {
            var id = this.get('id'),
              url = this.connector.connection.url;
            if (!id) {
              // Create a new node by POST /nodes
              url = Url.combine(url, 'nodes');
            } else if (id === 'volume') {
              // Access an existing volume by VERB /volumes/:type
              url = Url.combine(url, 'volumes', this.get('type'));
            } else if (!_.isNumber(id) || id > 0) {
              // Access an existing node by VERB /nodes/:id
              url = Url.combine(url, 'nodes', id);
            } else {
              throw new Error('Unsupported id value');
            }
            if (this.options.apiVersion) {
              url.getApiBase(this.options.apiVersion);
            }
            return url;
          },

          /**
           * Overrides
           * {@link https://backbonejs.org/#Model-url|Backbone.Model.url()}.
           *
           * @returns {*}
           */
          url: function () {
            var url = this.urlBase();
            var query;
            if (!this.isNew()) {
              if (this.get('id') === 'volume') {
                var expands = v1tov2.expandsV2toV1(this.expand);
                if (expands.length) {
                  query = $.param({ expand: expands }, true);
                }
              } else {
                if (this.collection) {
                  query = this._getCombinedUrlQuery({ withActions: true });
                } else {
                  query = this._getNodeUrlQuery({ withActions: true });
                }
                // Request just common properties by default; do not waste server
                // resources, because it would return all it could by default.
                // If somebody set fields to a subset of properties already, they
                // are responsible for including all needed information.
                if (!this.hasFields('properties') && !this.fetchExactFields) {
                  query = Url.combineQueryString(query, 'fields=properties');
                }
              }
            }
            return Url.appendQuery(url, query);
          },

          urlQueryWithoutActions: function () {
            var query;
            if (this.collection) {
              query = this._getCombinedUrlQuery({ withActions: false });
            } else {
              query = this._getNodeUrlQuery({ withActions: false });
            }
            if (!this.hasFields('properties') && !this.fetchExactFields) {
              query = query.concat({ fields: 'properties' });
            }
            return query;
          },

          urlQueryWithActionsOnly: function () {
            var query;
            if (this.collection) {
              var collection = this.getV2ParameterSource();
              query = this._getUrlQueryActionsFromSource(collection);
            } else {
              query = this.getRequestedCommandsUrlQuery();
            }
            return query;
          },

          // Gets the URL query using the parameters of the node only.
          _getNodeUrlQuery: function (options) {
            var query = Url.combineQueryString(
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getStateEnablingUrlQuery(),
              this.getAdditionalResourcesUrlQuery()
            );
            if (options.withActions) {
              query = Url.combineQueryString(query, this.getRequestedCommandsUrlQuery());
            }
            return query;
          },

          // Gets the URL query preferably using the parameters of the owning collection.
          _getCombinedUrlQuery: function (options) {
            var collection = this.getV2ParameterSource();
            var queryParts = this._getUrlQueryWithoutActionsFromSource(collection);
            if (options.withActions) {
              var actions = this._getUrlQueryActionsFromSource(collection);
              queryParts = queryParts.concat(actions);
            }
            return Url.combineQueryString.apply(Url, queryParts);
          },

          _getUrlQueryWithoutActionsFromSource: function (collection) {
            return [
              'getExpandableResourcesUrlQuery',
              'getAdditionalResourcesUrlQuery',
              'getStateEnablingUrlQuery',
              'getResourceFieldsUrlQuery'
            ].map(function (method) {
              var parameters = this[method]();
              if (_.isEmpty(parameters)) {
                // If no data limits were specified in the node
                // model, try to inherit them from the collection
                method = collection[method];
                if (method) {
                  return method.call(collection);
                }
              }
              return parameters;
            }, this);
          },

          _getUrlQueryActionsFromSource: function (collection) {
            var method = this.delayRestCommands ? 'getRequestedCommandsUrlQuery' : 'getAllCommandsUrlQuery';
            var commands = this[method]();
            if (_.isEmpty(commands)) {
              // No delayed actions could be enabled for the node
              // model, unless specifying the default action command.
              // The collection can give non-delayed commands only;
              // if it supports delayed actions or not.
              method = collection.getAllCommandsUrlQuery || collection.getRequestedCommandsUrlQuery;
              if (method) {
                commands = method.call(collection);
              }
            }
            // TODO: Remove this horrible code breaking componentisation.
            if (this.refernce_id || this.attributes.reference_id) {
              commands = _.extend(
                {
                  reference_id: this.refernce_id || this.attributes.reference_id
                },
                commands
              );
            }
            return commands;
          },

          /**
           * Overrides
           * {@link https://backbonejs.org/#Model-sync|Backbone.Model.sync()}
           * @param method {String} -  the CRUD method ("create", "read", "update", or "delete")
           * @param model {Backbone.Model} - the model to be saved (or collection to be read)
           * @param options {Object} - success and error callbacks, and all other jQuery request options
           * @returns {*}
           */
          sync: function (method, model, options) {
            if (method !== 'read') {
              adaptNotFetching(this, options);
            }
            if (method === 'read' && options.urlQueryWithActionsOnly) {
              return syncNodeWithSeparateCommands(this, options);
            }
            return originalSync.call(this, method, model, options);
          },

          /**
           * Overrides
           * {@link https://backbonejs.org/#Model-parse|Backbone.Model.parse()}.
           * parse is called whenever a model's data is returned by the server, in fetch, and save.
           * The function is passed the raw response object, and should return the attributes hash to be set on the model.
           * The default implementation is a no-op, simply passing through the JSON response.
           * Override this if you need to work with a preexisting API, or better namespace your responses.
           * @param response
           * @returns {*|{id}|{results}}
           */
          parse: function (response) {
            // A node obtained from a collection has the properties directly
            // in the object, while if obtained by a single call, they are
            // nested in the data sub-object.
            // node from v2/nodes/:id or v1/nodes/:id
            var results = response.results || response,
              // If node attributes are re-parsed, they will contain the "data"
              // object with properties from additional roles. Detect only "data"
              // from a v1 or a v2 response here.
              resultData = results.data,
              data = resultData && (resultData.id || resultData.properties) && resultData,
              // node from v2/nodes/:id or v2/nodes
              // node from v1/nodes/:id or v1/nodes
              node = (data && data.properties) || data || response;

            // However, some properties are scattered in the response object
            // directly, or even in artificial sub-objects like type_info,versions;
            // speak about developing API serving clients' needs, sigh.
            if (response.type !== undefined) {
              node.type = response.type;
            }
            if (response.type_name !== undefined) {
              node.type_name = response.type_name;
            }
            if (data && data.versions) {
              node.versions = data.versions;
            }
            _.extend(node, response.type_info);
            if (node.versions) {
              var version = node.versions;
              if (_.isArray(version)) {
                version = version[version.length - 1];
              }
              if (version) {
                _.extend(
                  node,
                  _.pick(version, [
                    'file_size',
                    'mime_type',
                    'version_id',
                    'version_number',
                    'version_number_major',
                    'version_number_minor'
                  ])
                );
              }
            }

            // Properties out of data are not passed to the constructor.  This
            // may yet get its own sub-model.
            _.defaults(node, {
              perspective: (results && results.perspective) || response.perspective
            });

            // Extract state flags like metadata token from the response.
            this.parseState(node, results);

            // Normalize V1 actions and V2 commands to [{signature}, ...]
            this._parseActions(node, results, response);

            // Normalize actions in the shortcut target sub-node
            var original = node.original_id && node.original_id.id ? node.original_id : node.original_id_expand;
            if (original) {
              this._parseActions(original, {}, original);
              // No faking default action permissions for shortcut originals;
              // only 'open' was not enough - all default actions are permitted
              // in DefaultActionController
            }

            // Normalize actions in the parent location sub-node
            var parent = node.parent_id && node.parent_id.id ? node.parent_id : node.parent_id_expand;
            if (parent) {
              this._parseActions(parent, {}, parent);
              if (!parent.actions.length) {
                // TODO: Remove this, as soon as the actions for parent
                // locations are returned by the server
                // Add (default) actions used for hyperlinks
                this._makeAccessible(parent);
              }
            }

            // V1 does not send the URL; if the 'default' command is available,
            // we can red it from there, otherwise it is not possible
            if (node.type === 140 && !node.url) {
              var defaultAction = _.findWhere(node.actions, {
                signature: 'default'
              });
              node.url = defaultAction && defaultAction.href;
            }

            // Make addable types available in the node constructor
            node.addable_types = response.addable_types;
            // Make columns available in the node constructor
            var columns = data && data.columns;
            if (columns) {
              node.columns = this._parseColumns(columns, response);
            }
            // Make definitions available in the node constructor
            var definitions = response.definitions || (results.metadata && results.metadata.properties);
            if (definitions) {
              node.definitions = this._parseDefinitions(definitions, columns);
            }

            // Make additional v2 data accessible in the model attributes;
            // data.properties are accessible as the flat node attributes
            // and columns with metadata are pre-parsed by helper methods
            if (data && data.properties) {
              node.data = _.omit(data, 'columns', 'metadata', 'properties');
            }

            // add reference_id to node for children under collection (ie., subtype 298) container.
            if (this.collection && this.collection.node && this.collection.node.get('type') === 298) {
              node.reference_id = this.collection.node.get('id');
            }
            // If node is getting updated by any of its actions, we are fetching entire node info
            // which includes promoted and non-promoted actions also. So to avoid re-fetch
            // nonpromoted actions from inline and toolbar setting 'csuiLazyActionsRetrieved'
            // attribute to node.
            if (
              this.get('csuiLazyActionsRetrieved') === undefined &&
              !!this.get('csuiDelayedActionsRetrieved') &&
              !_.isEmpty(this.changed)
            ) {
              node.csuiLazyActionsRetrieved = true;
            }
            return node;
          },

          _parseColumns: function (columns, response) {
            var columnKeys = response.definitions_order || (columns && _.pluck(columns, 'key'));
            return _.map(columnKeys, function (key) {
              return { key: key };
            });
          },

          _parseDefinitions: function (definitions, columns) {
            if (!definitions.size && (definitions.container_size || definitions.file_size)) {
              definitions.size = definitions.container_size || definitions.file_size;
              definitions.size.key = 'size';
              definitions.size.name = lang.sizeColumnTitle;
            }
            if (columns) {
              _.each(columns, function (column) {
                var columnKey = column.key,
                  definition = definitions[columnKey];
                if (!definition) {
                  definition = definitions[columnKey] = _.omit(column, 'data_type');
                  definition.type = column.data_type;
                }

                // for all user related column attributes let's add definition type as 14.
                var supportedPersonas = ['user', 'group', 'member'];
                if ($.inArray(definition.persona, supportedPersonas) !== -1) {
                  definition.type = 14;
                }

                // Take fileds=columns from v2 into account.
                const { sort_key: sortKey } = column;
                definition.sort = !!sortKey;
                if (sortKey && sortKey !== columnKey) {
                  definition.sort_key = sortKey;
                }
              });
              // Update the real value-carrying column, which does not end with
              // "_formatted", if only the "_formatted" one is present and not
              // the real one. "_formatted"  columns should not be used, because
              // they do not provide the real value for sorting, filtering, saving
              // or other scenarios, where it is needed. Also the right formatting
              // is specified in Smart UI. "_formatted" columns are for AJAX calls
              // from Classic UI, because they for at according to its design.
              _.each(columns, function (column) {
                var columnKey = column.key,
                  formattedIndex = columnKey.lastIndexOf('_formatted');
                if (formattedIndex >= 0) {
                  var realColumnKey = columnKey.substr(0, columnKey.length - 10),
                    definition = definitions[realColumnKey];
                  if (!definition) {
                    definition = definitions[realColumnKey] = _.omit(column, 'data_type');
                    definition.type = definition.data_type;
                  }
                  // Take fileds=columns from v2 into account.
                  const { sort_key: sortKey } = column;
                  definition.sort = !!sortKey;
                  if (sortKey && sortKey !== columnKey) {
                    definition.sort_key = sortKey;
                  }
                }
              });
            }
            return _.map(definitions, function (definition, key) {
              if (!definition.key) {
                definition.key = key;
              }
              return definition;
            });
          },

          _parseActions: function (node, results, response) {
            // Normalize V1 actions and V2 commands to [{signature}, ...]
            var actions =
                node.actions ||
                response.actions ||
                // v1/volumes/:type actions
                response.available_actions,
              commands;
            if (_.isArray(actions)) {
              // v1 actions
              _.each(actions, function (action) {
                // normalize the v1/volumes/:type actions
                if (!action.signature) {
                  action.signature = action.type;
                  action.name = action.type_name;
                  delete action.type;
                  delete action.type_name;
                }
              });
              commands = _.reduce(
                actions,
                function (result, action) {
                  result[action.signature] = {};
                  return result;
                },
                {}
              );
              node.actions = actions;
            } else {
              // v2-like commands added to v1 and v2 commands
              commands =
                node.commands ||
                response.commands ||
                response.actions ||
                // v2 actions
                (results && results.actions) ||
                {};
              // v2 moved the content of actions to actions.data and left
              // the actions object with the three keys only
              if (commands.data && commands.order && commands.map) {
                commands = commands.data;
              }
              node.actions = _.chain(commands)
                .keys()
                .map(function (key) {
                  var attributes = commands[key];
                  attributes.signature = key;
                  return attributes;
                })
                .value();
              delete node.commands;
              delete node.commands_map;
              delete node.commands_order;
            }
          },

          // TODO: Remove this, as soon as the actions for shortcut
          // targets, parents or other expanded nodes  are returned
          //  by the server
          _makeAccessible: function (original) {
            if (!original.actions.some(action => action.signature === 'open')) {
              original.actions.push({ signature: 'open' });
            }
          }
        }
      );
    }
  };

  var NodeActionCollection;

  function syncNodeWithSeparateCommands(node, options) {
    var deferred = $.Deferred();
    require(['nuc/models/node.actions'], function () {
      NodeActionCollection = arguments[0];
      var promiseForNode = fetchNodeDataAndDefaultActions(node, options);
      var promiseForActions = fetchNodeDelayedActions(node, options);
      options = _.defaults({ parse: false }, options);
      node
        .syncFromMultipleSources([promiseForNode, promiseForActions], mergeNodeWithActions, options)
        .then(deferred.resolve, deferred.reject);
    }, deferred.reject);
    return deferred.promise();
  }

  function mergeNodeWithActions(node, actions) {
    // If default actions were fetched by the data request, just append
    // the delayed ones, otherwise use the delayed ones as the complete array.
    if (node.actions) {
      node.actions.push(...actions);
    } else {
      node.actions = actions;
    }
    return node;
  }

  function getNodeDefaultActions(node, options) {
    // Use URL parameters either from an explicitly specified collection,
    // if the node will be added to the collection later, or from the parent
    // collection, if it's already there.
    const collection = options?.collection ?? node.collection;
    // The node can be in other collections like a selection collection too.
    // But the `collection` property will set only to the first collection,
    // which the node was added to, which is the fetching collection for nodes.
    // Only that parent collection carries URL parameters deciding the node scope.
    const defaultActionCommands = node.isCollectionV2ParameterSource(collection)
      ? collection.defaultActionCommands
      : node.defaultActionCommands;
    return defaultActionCommands;
  }

  function fetchNodeDataAndDefaultActions(originalNode, options) {
    // Use a cloned node to fetch the node with different URL parameters
    // (without actions) than the original node would use.
    var node = originalNode.clone();
    node.separateCommands = false;
    // Use URL parameters either from the explicitly specified collection,
    // or from the parent collection. The clone does not point to the parent
    // collection, that is why it is passed explicitly as the second choice.
    var collection = options.collection || originalNode.collection;
    // The node can be in a selection collection. Backbone add it to the first
    // collection, which uses add(). Only the full-weight collections that
    // fetch and then contain nodes can be considered parent collections
    // carrying the URL parameters to decide the node scope.
    if (node.isCollectionV2ParameterSource(collection)) {
      // The method getResourceScope may not be available on the collection.
      var parameterScope = node.getResourceScopeFrom(collection);
      node.setResourceScope(parameterScope);
    }
    // Back up the default action signatures and reset all action signatures.
    const defaultActionCommands = getNodeDefaultActions(originalNode, options);
    node.resetCommands();
    node.resetDefaultActionCommands();
    // If the node has default actions specified, they have to be fetched
    // together with the node data. They cannot be fetched by a separate
    // call, which is used to fetch all actions, avoiding a too long URL
    // if all actions were included in a GET request.
    // The actions needed are default actions for shortcut targets. They can
    // be fetched only by expanding the `original_id` property, when node
    // data is fetched. Not doing this would mean yet another separate call,
    // because only default actions are needed for shortcut targets, not all.
    if (defaultActionCommands?.length) {
      node.setCommands(defaultActionCommands);
    }
    node.invalidateFetch();
    return (
      node
        // Do not pass all options. They include Backbone callbacks for the
        // originating call, for example. Select only those, which need to
        // be performed to be compliant with Backbone. (Not the original URL
        // which might contain all actions.)
        .fetch(_.pick(options, 'headers', 'parse', 'silent'))
        .then(function () {
          return node.attributes;
        })
    );
  }

  function fetchNodeDelayedActions(node, options) {
    let { actions: commands, reference_id } = options.urlQueryWithActionsOnly;
    // If default actions are specified, they are always fetched together
    // with the node data by `fetchNodeDataAndDefaultActions`. No need to fetch
    // them by this separate request.
    const defaultActionCommands = getNodeDefaultActions(node, options);
    if (defaultActionCommands?.length) {
      commands = commands.filter(signature => !defaultActionCommands.includes(signature));
    }
    // All actions may be default.
    if (!commands.length) {
      return $.Deferred().resolve([]);
    }
    var actions = new NodeActionCollection(undefined, {
      connector: node.connector,
      nodes: [node.get('id')],
      commands,
      reference_id
    });
    return actions.fetch().then(function () {
      return actions.reduce(function (actions, node) {
        var attributes = node.actions.toJSON();
        return actions.concat(attributes);
      }, []);
    });
  }

  function adaptNotFetching(node, options) {
    var url = options.url;
    if (url && _.isString(url)) {
      // Omit URL parameters if this is not a GET request.
      options.url = url.replace(/\?.*$/, '');
    } else {
      // Ensure a URL without URL parameters by not letting it compute later.
      options.url = node.urlBase();
    }
  }

  return ServerAdaptorMixin;
});
