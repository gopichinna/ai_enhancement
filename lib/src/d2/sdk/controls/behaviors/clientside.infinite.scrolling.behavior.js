/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/behaviors/clientside.infinite.scrolling.behavior'
], function(ClientsideInfiniteScrollingBehaviorImpl){
  'use strict';

  /**
   * A `Marionette.view` behavior to implement infinite scrolling for views operating on `Backbone.Collection`.
   * The collection prototype has to be mixed with {@link ../../models/mixins/browsable.collection.mixin|BrowsableCollectionMixin}
   *
   * @example <caption>To use the behavior on a CompositeView</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior',
   *  'hbs!mybundle/some/path/template.hbs'
   * ], function(Marionette, InfiniteScrollingBehavior, template){
   *  'use strict';
   *
   *  var ChildView = Marionette.ItemView.extend({
   *    className: 'child-view'
   *  });
   *
   *  var MyListView = Marionette.CompositeView.extend({
   *    template: template, //template content simply is <div class="child-container"></div>
   *    childViewContainer: '.child-container',
   *    childView: ChildView,
   *    behaviors: {
   *      IScroll: {
   *        behaviorClass: InfiniteScrollingBehavior,
   *        contentParent: '.child-container', //The scroll parent element
   *        content: '.child-view', // outermost element of each item view
   *        fetchMoreItemsThreshold: 95, //Offset percentage in integer value that indicates when to consider a potential end of the visible list
   *        fetchMoreItemLength: 10 //How many more items to be fetched when scroll position has reached potential end
   *      }
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/controls/behaviors/clientside.infinite.scrolling.behavior} d2/sdk/controls/behaviors/"clientside.infinite.scrolling.behavior"
   * @name ClientsideInfiniteScrollingBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */
  var ClientsideInfiniteScrollingBehavior = ClientsideInfiniteScrollingBehaviorImpl.extend({

    /**
     * @constructs
     * @name ClientsideInfiniteScrollingBehavior
     * @alias module:ClientsideInfiniteScrollingBehavior
     * @param {object} options - Constructor options, automatically passed by Marionette from behavior configuration of a view
     * @param {string} options.contentParent - CSS selector to find the scrollable parent element
     * @param {string} options.content - CSS selector to find children of scrollable parent
     * @param {number} options.fetchMoreItemsThreshold - Threshold in percentage, used to calculate whether scrolling has reached end of list.
     * @param {number} options.fetchMoreItemLength - Number of new items to be fetched when scrolling has reached end of list.
     * @param {Marionette.View} view - The view instance associated with this behavior instance. Automatically set by Marionette.
     */
    constructor: function ClientsideInfiniteScrollingBehavior(options, view) {
      ClientsideInfiniteScrollingBehavior.__super__.constructor.call(this, options, view);
    }
  });

  return ClientsideInfiniteScrollingBehavior;
});