/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/list/sortable.list.view'
], function(SortableListViewImpl){
  'use strict';

  /**
   * A flat list view backed by a {@link external:Backbone.Collection|Backbone.Collection}. Items in the list view could be
   * dragged around to re-order them within the list.
   *
   * @example <caption>Typical usage</caption>
   * //In mybundle/trial/list/sortable.listitem.hbs
   * <div class="item-label" data-d2-key="{{name}}">{{label}}</div>
   *
   * //In a test module
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/sortable.list.view',
   *  'hbs!mybundle/trial/list/sortable.listitem'
   * ], function(Backbone, Marionette, SortableListView, template){
   *  'use strict';
   *
   *  var ItemView = Marionette.ItemView.extend({
   *    template: template,
   *    templateHelpers: function() {
   *      return {
   *        label: this.model.get('label'),
   *        name: this.model.get('id')
   *      };
   *    }
   *  });
   *
   *  var collection = new Backbone.Collection([
   *    {id: '1', label: 'One'},
   *    {id: '2', label: 'Two'},
   *    {id: '3', label: 'Three'}
   *  ]);
   *
   *  var listView = new SortableListView({itemView: ItemView, collection: collection, hasNonRemovableItem: true, isItemNonRemovable: function(){return true;}});
   *  new Marionette.Region({el: '.el-host'}).show(listView);
   *
   * });
   *
   * @module {d2/sdk/controls/list/sortable.list.view} d2/sdk/controls/list/"sortable.list.view"
   * @name SortableListView
   * @extends {external:Marionette.CompositeView}
   */

  /**
   * @external "Marionette.CompositeView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.compositeview.html
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var SortableListView = SortableListViewImpl.extend({

    /**
     * @constructs
     * @name SortableListView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {external:Marionette.ItemView} options.itemView - View class to use for rendering each item in the list.
     * @param {Boolean} [options.hasNonRemovableItem=false] - Whether the list has non-removable item. If set to `true` then `isItemNonRemovable()` callback is executed
     * for each item to decide removability.
     * @param {RemovableDetectionCallback} [options.isItemNonRemovable] - Callback to decide if a particular item is non-removable
     */
    constructor: function SortableListView(options) {
      SortableListView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @callback RemovableDetectionCallback
   * @param {Backbone.Model} model - Model behind the item being evaluated.
   * @return {Boolean} Return `true` to indicate the item shouldn't be removable.
   */

  return SortableListView;
});