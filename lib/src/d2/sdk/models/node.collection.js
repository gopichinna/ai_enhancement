/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/models/nodes',
  'd2/sdk/models/node.model'
], function(NodeCollectionImpl, NodeModel){
  'use strict';

  /**
   * Represents an arbitrary collection of {@link ./node.model|NodeModel}s. Mostly used in the context of command execution.
   *
   * Even if the collection is instantiated with literal properties, it maps those properties into instance of `NodeModel`.
   *
   * @example
   * define([
   *    'd2/sdk/models/node.collection'
   * ], function(NodeCollection){
   *    'use strict';
   *
   *    var nodeCollection = new NodeCollection([
   *      {id: '0c0015fa8000291e'},
   *      {id: '0b0015fa80005598'}
   *    ]);
   *
   *    console.log('There are ' + nodeCollection.length + ' models');
   *    console.log('First model is with id : ' + nodeCollection.at(0).get('id'));
   * });
   *
   * @module {d2/sdk/models/node.collection} d2/sdk/models/"node.collection"
   * @name NodeCollection
   * @extends external:Backbone.Collection
   *
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var NodeCollection = NodeCollectionImpl.extend({
    model: NodeModel,

    constructor: function NodeCollection(models, options) {
      NodeCollection.__super__.constructor.call(this, models, options);
    }
  });

  return NodeCollection;
});