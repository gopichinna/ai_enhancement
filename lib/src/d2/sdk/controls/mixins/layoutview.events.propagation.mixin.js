/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin'
], function(LayoutViewEventPropagationMixinImpl){
  'use strict';

  /**
   * Event propagation mixin for Marionette LayoutView. Marionette Layout view fails to propagate view-lifecycle events to different
   * child views that it hosts in its regions.
   * This mixin makes it possible to establish the broken chain in a declarative style.
   *
   * @example <caption>To use the mixin in a layout view</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/mixins/layoutview.events.propagation.mixin',
   * ], function(Marionette, LayoutViewEventsPropagationMixin){
   *  'use strict';
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    regions: {
   *      header: '.header',
   *      footer: '.footer'
   *    },
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      MyView.__super__.constructor.call(this, options);
   *
   *      this.propagateEventsToRegions();
   *    }
   *  });
   *
   *  LayoutViewEventsPropagationMixin.mixin(MyView.prototype);
   *
   *  var view = new MyView();
   *  new Marionette.Region({el: '.host-element'}).show(view); // With this default setup, whenever MyView instance receives 'dom:refresh' event, it is also relayed to views hosted in regions 'header' & 'footer'.
   * });
   *
   * @module {d2/sdk/controls/mixins/layoutview.events.propagation.mixin} d2/sdk/controls/mixins/"layoutview.events.propagation.mixin"
   * @name LayoutViewEventPropagationMixin
   * @extends {Object}
   */

  var LayoutViewEventPropagationMixin = LayoutViewEventPropagationMixinImpl;

  /**
   * @function
   * @name propagateEventsToRegions
   * @description This method gets mixed with any Marionette.View prototype. This method should be called from within a view instance post construction.
   * @returns {void}
   * @instance
   */

  /**
   *
   * @name _eventsToPropagateToRegions
   * @type {string[]}
   * @default ['dom:refresh']
   * @description This property gets mixed with the view prototype. It should contain a list of Marionette view lifecycle events that are desired to
   * be propagated to each hosted child view when those events occur at the LayoutView level.
   * @instance
   */

  /**
   * @function
   * @name mixin
   * @description Method to add this mixin to a view prototype.
   * @param {any} prototype - The view prototype where is mixin is to be merged.
   * @returns {void}
   * @static
   */

  return LayoutViewEventPropagationMixin;
});