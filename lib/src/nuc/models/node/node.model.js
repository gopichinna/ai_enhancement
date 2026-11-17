/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'module',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/models/actions',
  'nuc/models/addabletypes',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/models/mixins/v2.fields/v2.fields.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/state.carrier/state.carrier.mixin',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'nuc/models/node/node.definition2.collection',
  'nuc/models/node.columns2',
  'nuc/models/node/server.adaptor.mixin',
  'nuc/models/utils/v1tov2',
  'nuc/utils/deepClone/deepClone'
], function (
  module,
  _,
  Backbone,
  ActionCollection,
  AddableTypesCollection,
  ResourceMixin,
  UploadableMixin,
  FieldsV2Mixin,
  ExpandableV2Mixin,
  StateCarrierMixin,
  DelayedCommandableV2Mixin,
  AdditionalResourcesV2Mixin,
  NodeDefinition2Collection,
  NodeColumn2Collection,
  ServerAdaptorMixin,
  v1tov2
) {
  'use strict';

  var config = _.extend(
    {
      idAttribute: null,
      // ID should be always handles as a black box. The client should send
      // it to the server the same, as it was received. The server should send
      // IDs in object properties; it should not send URLs, which the client
      // would have to parse and extract the ID from them.
      //
      // This flag can be used in the code, that does not follow the best
      // practice and parses an integer ID out of some string.
      usesIntegerId: true,
      // Fetching of permitted actions in parallel with the node information is
      // specific to OTCS only. Because role-based actions were not implemented
      // and permitted actions were added for commands, which could not be
      // configured, the actions became wasteful and too many. Fetching them in
      // parallel with the node fixes only the symptom of the problem, instead of
      // addressing it properly.
      separateCommands: false,
      separateCommandsThreshold: 10
    },
    module.config()
  );

  /*
  + ----------------------------------------------------------------------------
  + NodeModel
  + ----------------------------------------------------------------------------
  */

  // the following typedefs are needed for documentation purpuses and have no influence to code

  /**
   * @typedef NodeModel~create_user_id_expand
   * @property {String} name - The creator's name.
   */

  /**
   * @typedef NodeModel~modify_user_id_expand
   * @property {String} name - The modifier's name.
   */

  /**
   * @typedef NodeModel~reserved_user_id_expand
   * @property {String} name - The reserver's name.
   */

  /**
   * @typedef NodeModel~original_id_expand
   * @property {Boolean} container - Indicates if the original node is a container.
   * @property {String} mime_type - Mime type of the original node.
   * @property {Boolean} openable - Indication if the original node can be opened by the current user.
   * @property {Integer} type - The type of the original node. E.g. 144 stands for document, 0 stands for folder etc...
   * @property {Boolean} version_number - Version number of the original node.
   */

  /**
   * @typedef NodeModel~attributes
   * @property {Integer} id - The id of the node (document).
   * @property {String} name - The name of this node
   * @property {Object} name_multilingual - An alternative name for each supported locale.
   * @property {Integer} type - The type of this node. E.g. 144 stands for document, 0 stands for folder etc...
   * @property {String} type_name - The type name of this node, e.g. 'Document'.
   * @property {Boolean} versionable - Indicates if this node is versionable.
   * @property {Array} actions - List of actions available for the node.
   * @property {Array} addable_types - List of types addable to that node (property container has to be true).
   * @property {Boolean} advanced_versioning - Indicates if this node is under advanced versioning.
   * @property {Boolean} container - Indicates if this node is a container.
   * @property {Integer} container_size - Container size (for containers only).
   * @property {Integer} comments - Number of comments added to this node.
   * @property {String} create_date - Creation date, given in ISO format.
   * @property {Integer} create_user_id - The user id of the creator of this node.
   * @property {NodeModel~create_user_id_expand} create_user_id_expand - The expanded create user id information.
   * @property {Object} data - Used by extensions to provide additional data.
   * @property {String} description - The description of the node.
   * @property {Object} description_multilingual - An alternative description for each supported locale.
   * @property {Boolean} favorite - Indication if this node is favorite of the current user.
   * @property {Boolean} hidden - Indication if this node is hidden.
   * @property {String} mime_type - Mime type of the current node.
   * @property {String} modify_date - Date of last modification of this node, given in ISO format.
   * @property {Array} modify_images - Deprecated.
   * @property {Integer} modify_user_id - The user id of the creator of this node.
   * @property {NodeModel~modify_user_id_expand} modify_user_id_expand - The expanded modify user id information.
   * @property {Boolean} openable - Indication if this node can be opened by the current user.
   * @property {Integer} original_id - Id of the original node (valid only for nodes of type 'Shortcut').
   * @property {NodeModel~original_id_expand} original_id_expand - Expanded information for original_id.
   * @property {String} owner - The owner of the node.
   * @property {Integer} owner_group_id - The id of the owner's group.
   * @property {Integer} owner_user_id - The id of the owner's user.
   * @property {Integer} parent_id - Id of the parent node (container).
   * @property {String} permissions_model - The permission model, which is one of 'simple' or 'advanced'.
   * @property {Object} perspective - Perspective details.
   * @property {Boolean} reserved - Indication if this node is reserved.
   * @property {String} reserved_date - Date of reservation, given in ISO format.
   * @property {Boolean} reserved_shared_collaboration - Flag indicating reservation for shared collaboration.
   * @property {Integer} reserved_user_id - The user id of the user which has reserved this node.
   * @property {NodeModel~reserved_user_id_expand} reserved_user_id_expand - The reserved user id information.
   * @property {Integer} size - Size of the document, in Bytes.
   * @property {String} size_formatted - Formatted size of the document
   * @property {Object} state - State object.
   * @property {Object} status - Status.
   * @property {Boolean} versions_control_advanced - Indicates if this node uses advanced versioning.
   * @property {Integer} volume_id - The node's volume id.
   * @property {undefined} wnd_comments - Obsolete.
   *
   */

  var NodeModel = Backbone.Model.extend(
    /** @lends NodeModel.prototype **/
    {
      /**
       * idAttribute
       * @memberof NodeModel
       * @instance
       * @type String
       * */
      idAttribute: config.idAttribute,

      /**
     * @constructor
     * @param attributes
     * @param options
     * @mixes AdditionalResourcesV2Mixin
     * @mixes ConnectableMixin
     * @mixes FieldsV2Mixin
     * @mixes ServerAdaptorMixin
     * @mixes StateCarrierMixin
     * @mixes DelayedCommandableV2Mixin
     * @mixes ResourceMixin
     * @mixes UploadableMixin
     * @augments Backbone.Model
     * @name NodeModel
     * @requires  nuc/models/actions
     * @description Provides read/write access to CS nodes.  When creating a new instance, you
     * need to pass an instance of the `Connector` to the constructor to connect it
     * to the server. Nodes can be fetched single or within a collection like container children,
     * for example.  The `NodeModel` supports initialization from the server
     * responses, which have the same response format as the core CS REST API.
     * The properties as expected from a view are (given as an abstract type, but actually is a Backbone
     * attributes list): {@link NodeModel~attributes}.
     * The NodeModel class uses several mixins, which encapsulate different tasks, as there are
     * * **AdditionalResourcesV2Mixin** - supports the setting of additional URL query parameters necessary for V2 of CS REST API
     * * **ConnectableMixin** - enables the handling of server connections
     * * **DelayedCommandableMixin** - provides support for fetching permitted actions
     * by an extra call after the primary node model has been fetched.
     * * **FieldsV2Mixin** - Provides support for the setting fields URL query parameter as introduced by
     * the `api/v2/members/favorites` or `api/v2/members/accessed` (V2) resources.
     * * **ServerAdaptorMixin** - Overrides the methods of Backbone.Model, which are responsible for fetching and
     * parsing data: `url()`, `sync()` and `parse()`. The overrides are Content Server specific. If you want to support
     * a different server than CS, you usually have to override this mixin.
     * * **StateCarrierMixin** - Provides support for maintaining the state properties as introduced
     * by the `api/v2/nodes/:id` or `api/v2/nodes/:id/nodes` (V2) resources.
     * * **ResourceMixin** - Helps implementing a model for a typical server resource, which has an identifier
     * (the property `id` by default), by combining the following three mixins: ConnectableMixin, FetchableMixin and AutoFetchableMixin.
     * * **UploadableMixin** - Enables creating and modifying the resource behind a `Backbone.Model`. Simplifies requests
     * with multi-part content, enables mocking by mockjax and supports pasing the JSON body as form-encoded parameter "body".


     * @example
// Fetch a concrete node and print its name on the console
var connector = new Connector({
                      connection: {
                        url: '//server/instance/cs/api/v1',
                        supportPath: '/instancesupport'
                      }
                    }),
     node = new NodeModel({
                        id: 1234
                      }, {
                        connector: connector
                      });

 node.fetch()
 .done(function () {
          console.log(node.get('name'));
        });

 // Create a model for the Enterprise Volume by its subtype
 var enterpriseVolume = new NodeModel({
                        id: 'volume',
                        type: 141
                      }, {
                        connector: connector
                      });

     */

      constructor: function NodeModel(attributes, options) {
        attributes || (attributes = {});
        options || (options = {});

        Backbone.Model.prototype.constructor.call(this, attributes, options);

        this.options = _.pick(options, ['connector']);

        this.makeResource(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateCarrier(options, attributes)
          .makeDelayedCommandableV2(options)
          .makeUploadable(options)
          .makeServerAdaptor(options);

        // Enable fetching of permitted actions in parallel with node information
        // if requested and if they exceed the threshold configured above.
        var separateCommands = options.separateCommands;
        this.separateCommands = separateCommands !== undefined ? separateCommands : config.separateCommands;

        this.setState(attributes);
        // Ensure sub-models; these set by _setCollectionProperty should
        // be always available, but this.set called from Backbone.Model
        // constructor creates them only, if they are in the attributes
        if (!attributes.actions) {
          this._setCollectionProperty('actions', ActionCollection, attributes, options);
        }
        if (!attributes.addable_types) {
          this._setCollectionProperty('addable_types', AddableTypesCollection, attributes, options);
        }
        if (!attributes.definitions) {
          this._setCollectionProperty('definitions', NodeDefinition2Collection, attributes, options);
        }
        if (!attributes.columns) {
          this._setCollectionProperty('columns', NodeColumn2Collection, attributes, options);
        }
        // Ensure sub-models; these set by _setNodeProperty are optional
        // and if this.set called from Backbone.Model didn't create them,
        // because they are not in the attributes, we won't do it here
      },

      /**
       * Clones this NodeModel.
       * @function
       * @returns {NodeModel}
       */
      clone: function () {
        var clone = new this.constructor(this.attributes, {
          connector: this.connector,
          fields: _.deepClone(this.fields),
          expand: _.deepClone(this.expand),
          stateEnabled: this.stateEnabled,
          includeResources: _.clone(this._additionalResources),
          commands: _.clone(this.commands),
          defaultActionCommands: _.clone(this.defaultActionCommands),
          delayRestCommands: this.delayRestCommands,
          separateCommands: this.separateCommands
        });
        clone.actions.reset(this.actions.toJSON());
        clone.fetched = this.fetched;
        clone.error = this.error;
        clone.state.set(this.state.toJSON());
        return clone;
      },

      /**
       * @method
       * @returns {boolean}
       * @description
       * Indicates if this NodeModel is new, i.e. has no `id` attribute set.
       */
      isNew: function () {
        return !this.has('id');
      },

      /**
       * Indicates if the collection supports v2 REST API; use it directly as a URL query source.
       * @param collection
       * @returns {*|FieldsV2Mixin.makeFieldsV2|makeFieldsV2|t.makeFieldsV2}
       */
      isCollectionV2ParameterSource: function (collection) {
        // If the collection supports v2 REST API, use it directly
        // as a URL query source.
        return collection && collection.makeFieldsV2;
      },

      /**
       * If the collection associated with this NodeModel is a V2 parameter source,
       * @returns {*|NodeModel|*}
       */
      getV2ParameterSource: function () {
        var collection = this.collection;
        if (this.isCollectionV2ParameterSource(collection)) {
          return collection;
        }
        // Otherwise use a v2 node node model as a URL query source
        // and include parameters from the v1 collection there
        var node = this.clone();
        if (collection) {
          var additionalResources = collection._additionalResources;
          if (additionalResources) {
            node.includeResources(additionalResources);
          }
          var defaultActionCommands = collection.defaultActionCommands;
          if (defaultActionCommands) {
            node.setDefaultActionCommands(defaultActionCommands);
          }
          var commands = collection.includeCommands;
          if (commands) {
            node.setCommands(commands);
          }
          var expand = collection.expand;
          if (expand) {
            node.setExpand(v1tov2.includeExpandsV1toV2(expand));
          }
        }
        return node;
      },

      /**
       * Set properties.
       * @param key
       * @param val
       * @param options
       * @returns {NodeModel|any}
       */
      set: function (key, val, options) {
        var attrs;
        if (key == null) {
          return this;
        }

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (typeof key === 'object') {
          attrs = key;
          options = val;
        } else {
          (attrs = {})[key] = val;
        }

        options || (options = {});
        // Using 'skipSetValue' to skip "sync" call in case of rename for Grid-view
        this.setState(attrs);
        if (val && val.skipSetValue) {
          return;
        }

        // TODO: Support sub-models and sub-collections in general
        if (attrs.actions) {
          this._setCollectionProperty('actions', ActionCollection, attrs, options);
        }
        if (attrs.addable_types) {
          this._setCollectionProperty('addable_types', AddableTypesCollection, attrs, options);
        }
        if (attrs.definitions) {
          this._setCollectionProperty('definitions', NodeDefinition2Collection, attrs, options);
        }
        if (attrs.columns) {
          this._setCollectionProperty('columns', NodeColumn2Collection, attrs, options);
        }
        if (attrs.original_id !== undefined) {
          this._setNodeProperty('original', attrs, options);
        }
        if (attrs.parent_id !== undefined) {
          this._setNodeProperty('parent', attrs, options);
        }
        if (attrs.volume_id !== undefined) {
          this._setNodeProperty('volume', attrs, options);
        }

        // do the usual set
        return Backbone.Model.prototype.set.call(this, attrs, options);
      },

      /**
     * @function
     * @description
     * Triggers
     * - a Backbone `reset` event for all sub-collections (`actions`, `addableTypes`, `definitions`, `columns`)
     * - a Backbone `change` event for all sub-models (`original`, `parent`, `volume`)
     * - a Backbone `change` event for all attributes (see {@link NodeModel~attributes})

     */
      triggerAllChanges: function () {
        // Trigger reset on all sub-collections
        triggerReset(this.actions);
        triggerReset(this.addableTypes);
        triggerReset(this.definitions);
        triggerReset(this.columns);

        // Trigger change on all sub-model.
        triggerChange(this.original);
        triggerChange(this.parent);
        triggerChange(this.volume);

        // Trigger change on all model attributes.
        triggerChange(this);

        function triggerReset(collection) {
          if (collection) {
            collection.trigger('reset', collection);
          }
        }

        function triggerChange(model) {
          if (model) {
            var attributes = model.attributes;
            Object.keys(attributes).forEach(function (attributeName) {
              model.trigger('change:' + attributeName, model, attributes[attributeName]);
            });
            model.trigger('change', model);
          }
        }
      },

      /**
       * Set a collection property.
       * @param attribute
       * @param Class
       * @param attributes
       * @param options
       * @private
       */
      _setCollectionProperty: function (attribute, Class, attributes, options) {
        var property = _.str.camelize(attribute),
          models = attributes[attribute],
          collection = this[property];
        if (collection) {
          collection.reset(models, {silent: options && options.silent});
        } else {
          this[property] = new Class(models, {
            // When this.set is called from the Backbome.Model constructor,
            // the current node hasn't been conected yet.  Sub-nodes would
            // be disconnected, if just this.connector would be used.  The
            // connector may be in the constructor options, if the caller
            // wanted to connect the node right away.
            connector: this.connector || options && options.connector
          });
        }
      },

      /**
       * Set a node property.
       * @param name
       * @param source
       * @param options
       * @private
       */
      _setNodeProperty: function (name, source, options) {
        // v1 expands the _id property directly, v2 adds an additional
        // one _id_expand
        var value = source[name + '_id_expand'] || source[name + '_id'];
        // If the property was not expanded, initialize the model just
        // with the object identifier
        if (value && !_.isObject(value)) {
          value = { id: value };
        }
        if (_.isObject(value)) {
          if (this[name]) {
            this[name].set(value, { silent: options && options.silent });
          } else {
            this[name] = new NodeModel(value, {
              // When this.set is called from the Backbome.Model constructor,
              // the current node hasn't been conected yet.  Sub-nodes would
              // be disconnected, if just this.connector would be used.  The
              // connector may be in the constructor options, if the caller
              // wanted to connect the node right away.
              connector: this.connector || (options && options.connector)
            });
          }
        } else {
          delete this[name];
        }
      },

      /**
       * Get URL params data for associated resource
       * @returns {*}
       */
      getResourceScope: function () {
        var parameterSource = this.getV2ParameterSource();
        return _.deepClone({
          fields: _.isEmpty(this.fields) ? parameterSource.fields : this.fields,
          expand: _.isEmpty(this.expand) ? parameterSource.expand : this.expand,
          includeResources: _.isEmpty(this._additionalResources)
            ? parameterSource._additionalResources
            : this._additionalResources,
          commands: _.isEmpty(this.commands) ? parameterSource.commands : this.commands,
          defaultActionCommands: this.defaultActionCommands
        });
      },

      /**
       * Get URL params data for given resource
       * @param source
       * @returns {*}
       */
      getResourceScopeFrom: function (source) {
        return _.deepClone({
          fields: source.fields,
          expand: source.expand,
          includeResources: source._additionalResources,
          commands: source.commands,
          defaultActionCommands: source.defaultActionCommands
        });
      },

      /**
       * Set URL params data
       * @param scope
       */
      setResourceScope: function (scope) {
        this.excludeResources();
        scope.includeResources && this.includeResources(scope.includeResources);
        this.resetFields();
        scope.fields && this.setFields(scope.fields);
        this.resetExpand();
        scope.expand && this.setExpand(scope.expand);
        this.resetCommands();
        scope.commands && this.setCommands(scope.commands);
        this.resetDefaultActionCommands();
        scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
      },

      /**
       * Serialize this node to String (`id` resp. `volume`).
       * @returns {string}
       */
      toString: function () {
        // Format a string for logging purposes
        var id = this.get('id');
        if (id === 'volume') {
          return 'volume:' + this.get('type');
        } else if (id != null) {
          return 'node:' + id;
        }
        return 'node:invalid';
      }
    },
    {
      usesIntegerId: config.usesIntegerId
    }
  );

  AdditionalResourcesV2Mixin.mixin(NodeModel.prototype);
  FieldsV2Mixin.mixin(NodeModel.prototype);
  ExpandableV2Mixin.mixin(NodeModel.prototype);
  StateCarrierMixin.mixin(NodeModel.prototype);
  DelayedCommandableV2Mixin.mixin(NodeModel.prototype);
  UploadableMixin.mixin(NodeModel.prototype);
  ResourceMixin.mixin(NodeModel.prototype);
  ServerAdaptorMixin.mixin(NodeModel.prototype);

  /**
   * Indicates if this NodeModel is fetchable, i.e. has an associated node id.
   * @method
   * @returns {boolean}
   */
  NodeModel.prototype.isFetchable = function () {
    // TODO: Remove this condition, as soon as nobody uses -1 as an invalid ID.
    if (NodeModel.usesIntegerId) {
      var id = this.get('id');
      return id > 0 || id === 'volume';
    }
    return !!this.get('id');
  };

  var originalFetch = NodeModel.prototype.fetch;
  /**
   * Overrides the Backbone.Model 'fetch' method. Allows to set a target collection via `options`.
   * @param options {Object} - Set the `collection` property to define a target collection.
   * @returns {*}
   */
  NodeModel.prototype.fetch = function (options) {
    options || (options = {});

    // If not overridden, Use the v2 URL for GET requests.
    // If not overridden and the target collection has been specified,
    // let the url method use its data-limiting parameters.
    if (!options.url) {
      var originalCollection = this.collection,
        newCollection = options.collection;
      if (newCollection) {
        this.collection = newCollection;
      }
      computeUrl(this, options);
      if (newCollection) {
        this.collection = originalCollection;
      }
    }

    return originalFetch.call(this, options);
  };

  /**
   * Compute URL for this node.
   * @method
   * @param node
   * @param options
   */
  function computeUrl(node, options) {
    // Support separate fetching of permitted actions only if the server
    // adaptor provides methods for it. And only for a v2 node.
    // If the actions are delayed, no need to separate the calls.
    if (
      node.separateCommands &&
      !node.delayRestCommands &&
      node.urlQueryWithActionsOnly &&
      node.get('id') !== 'volume'
    ) {
      var actionsQuery = _.result(node, 'urlQueryWithActionsOnly');
      // The URL has tt contain the multi-value "actions" parameter.
      if (actionsQuery && actionsQuery.actions.length > config.separateCommandsThreshold) {
        // Give a hint to the server adaptor to fetch the actions separately.
        options.urlQueryWithActionsOnly = actionsQuery;
        return;
      }
    }
    // Ensure using the v2 URL unless volume information is request.
    var url = _.result(node, 'url');
    if (url.indexOf('/volumes') < 0) {
      url = url.replace('/api/v1/', '/api/v2/');
    }
    options.url = url;
  }

  return NodeModel;
});
