/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/list/listitem.type.node.view'
], function(ListItemTypeNodeViewImpl){
  'use strict';

  /**
   * A list item view that can work with any {@link ../../models/node.model|NodeModel}.
   *
   * @see {@link ./listitem.type.model.view|ListItemTypeNode}
   *
   * @example <caption>Sample usage</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/simple.list.view',
   *  'd2/sdk/controls/list/listitem.type.node.view',
   *  'd2/sdk/models/node.model'
   * ], function(Backbone, Marionette, ListView, ListItemTypeNodeView, NodeModel){
   *  'use strict';
   *
   *   var MyListView = ListView.extend({
   *    childView: ListItemTypeNodeView,
   *    constructor: function MyListView(options) {
   *      options = options || {};
   *      MyListView.__super__.constructor.call(this, options);
   *    }
   *  });
   *
   *  var MyCollection = Backbone.Collection.extend({
   *    model: NodeModel
   *  });
   *
   *  var collection = new MyCollection([
   *    {id: '1', name: 'One', mime_type: 'application/pdf'},
   *    {id: '2', name: 'Two', mime_type: 'image/jpg'}
   *  ]);
   *
   *  new Marionette.Region({el: '.host-el'}).show(new MyListView({
   *    collection: collection
   *  }));
   * });
   *
   * @module {d2/sdk/controls/list/listitem.type.node.view} d2/sdk/controls/list/"listitem.type.node.view"
   * @name ListItemTypeNode
   * @extends {external:ListItemTypeModel}
   */

  /**
   * @external ListItemTypeModel
   * @see ./listitem.type.model.view
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ListItemTypeNodeView = ListItemTypeNodeViewImpl.extend({
    constructor: function ListItemTypeNodeView(options) {
      options = options || {};
      ListItemTypeNodeView.__super__.constructor.call(this, options);
    }
  });

  return ListItemTypeNodeView;
});