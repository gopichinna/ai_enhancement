/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/models/node/node.model'
], function(NodeModelImpl){
  'use strict';

  /**
   * NodeModel. Represents a Documentum object. Holds data attributes that correspond to equivalent Documentum object properties.
   *
   * Smartview core framework uses a similar interface. See {@link ../../nuc/models/node/node.model|NodeModel}
   *
   * @example
   *
   * define([
   *    'd2/sdk/models/node.model',
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/factory'
   * ], function(NodeModel, contextUtils, ConnectorFactory){
   *  'use strict';
   *
   *  //To instantiate a NodeModel and fetch details of a Documentum object with id '090015fa8000441a'
   *  var context = contextUtils.getPerspectiveContext(),
   *    connector = context.getObject(ConnectorFactory);
   *
   *  var node = new NodeModel({id: '090015fa8000441a'}, {connector: connector});
   *  //connector instance must be passed in the constructor options for all fetchable nodes.
   *
   *  node.fetch().done(function(){
   *    console.log('Node name: ' + node.get('name');
   *  }).fail(function(){
   *    console.log('Failed fetching node with id:' + node.get('id'));
   *  });
   *
   *
   *  //NodeModel could also be extended to suit particular Docuemntum type specific usage
   *  var TaskModel = NodeModel.extend({
   *    constructor: function TaskModel(attr, options) {
   *      TaskModel.__super__.constructor.call(this, attr, options);
   *    },
   *
   *    parse: function(response, options) {
   *      var data = TaskModel.__super__.parse.call(this, response, options);
   *
   *      //Custom logic to parse task specific attributes
   *
   *      return data;
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/models/node.model} d2/sdk/models/"node.model"
   * @name NodeModel
   * @extends {external:Backbone.Model}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external ResourceMixin
   * @see ./mixins/resource.mixin
   */

  /**
   * @external CommandableMixin
   * @see ./mixins/commandable.mixin
   */

  /**
   * @constructs
   * @alias module:NodeModel
   * @param {object} [attributes] - An object hash containing set of initial attributes for the NodeModel.
   * @param {object} [options] - Constructor options. Mixin specific options are supported as-is through constructor options.
   * @param {Connector} [options.connector] - Mandatory if the NodeModel is to be synced with server.
   * @param {Boolean} [options.ignoreObjectData] - Whether to fetch additional data like menu actions, favorited status etc. when this node syncs with server.
   * Defaults to `false`. This flag acts as a master flag for other additional data specific flags like `fetchAction`, `fetchFavorites`, `fetchPreviewFormats`,
   * `fetchRelationsCount` & `fetchExternalShare`.
   * @param {Boolean} [options.fetchActions] - Whether to fetch menu actions after this node syncs with server. Defaults to `true`.
   * @param {Boolean} [options.fetchFavorites] - Whether to fetch 'favorited' status for this nodes after sync with server. Defaults to `true`.
   * @param {Boolean} [options.fetchPreviewFormats] - Whether to fetch preview formats for the node after it has synced with server. Defaults to `true`.
   * @param {Boolean} [options.fetchRelationsCount] - Whether to fetch relations count for the node after it has synced with server. Defaults to `true`.
   * @param {Boolean} [options.fetchExternalShare] - Whether to fetch external share status for the node after it has synced with server. Defaults to `true`.
   * @mixes external:ResourceMixin
   * @mixes external:CommandableMixin
   */
  var NodeModel = NodeModelImpl.extend({
    constructor: function NodeModel(attributes, options) {
      options = options || {};

      options.delayedActionsOptions = options.delayedActionsOptions || options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.nonPromotedActionsOptions || options.d2ActionsOptions;
      options.additionalActionsOptions = options.additionalActionsOptions || options.d2ActionsOptions;

      NodeModel.__super__.constructor.call(this, attributes, options);
    }
  });

  return NodeModel;
});