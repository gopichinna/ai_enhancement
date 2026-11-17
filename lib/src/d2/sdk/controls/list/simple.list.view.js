/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/list/list.view'
], function(ListViewImpl){
  'use strict';

  /**
   * A flat list view backed by a {@link external:Backbone.Collection|Backbone.Collection}.
   *
   * `Backbone.Model` instances could be added/removed from the backing collection to update the view dynamically.
   *
   * @see {@link ./listitem.type.model.view|ListItemTypeModel}
   * @see {@link ./listitem.type.node.view|ListItemTypeNode}
   *
   * @example <caption>Sample list with a selection</caption>
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
   *    collection: collection, selectedModel: new NodeModel({id: '2'})
   *  }));
   * });
   *
   * @module {d2/sdk/controls/list/simple.list.view} d2/sdk/controls/list/"simple.list.view"
   * @name SimpleListView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  /**
   * @external NodeModel
   * @see ../../models/node.model
   */

  var SimpleListView = ListViewImpl.extend({

    /**
     * @constructs
     * @name SimpleListView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {string} [options.emptyStateMessage] - Message to show when there are no items in the associated collection.
     * @param {external:NodeModel} [options.selectedModel] - Show a selection highlight for this model
     *
     */
    constructor: function ListViewImpl(options) {
      SimpleListView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @name mergeAttributesFromSelectedModelOnIDChange
   * @type {Boolean}
   * @default true
   * @description Whether to merge attributes of constructor option `selectedModel` to matching model within the collection
   * whenever `id` attribute of the `selectedModel` changes.
   * @instance
   */

  /**
   * @name skippableAttributesOnMerge
   * @type {string[]}
   * @default ['name']
   * @description Which attributes to skip while merging from `selectedModel` to a matching model within the collection
   * @instance
   */

  /**
   * @name attributesUsedForEqualityComparison
   * @type {string[]}
   * @default ['id']
   * @description Which attributes are used to compare for equality of `selectedModel` and models within the collection
   * @instance
   */

  return SimpleListView;
});