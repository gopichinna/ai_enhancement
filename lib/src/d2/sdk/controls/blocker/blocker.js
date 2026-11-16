/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/progressblocker/blocker'
], function(BlockingViewImpl){
  'use strict';

  /**
   * UI blocker. Used to temporarily make the whole or part of Smart View UI non-interactive to block any unexpected user
   * input while executing a critical piece of logic either in the background or foreground.
   *
   * @module {d2/sdk/controls/blocker/blocker} d2/sdk/controls/blocker/blocker
   * @name BlockingView
   * @extends {Object}
   *
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  return {
    /**
     * Mix progress blocking APIs as well as well as blocker instance to a view.
     * @param {external:Marionette.View} view - The view instance where blocking APIs are to be mixed.
     * @mixes BlockerAPI
     * @memberOf module:BlockingView
     * @example <caption>An item view showing/hiding blocker when its model syncs</caption>
     * define([
     *    'nuc/lib/marionette',
     *    'd2/sdk/controls/blocker/blocker'
     *    'd2/sdk/models/node.model',
     * ], function(Marionette, BlockingView, NodeModel){
     *    'use strict';
     *
     *    var NodeView = Marionette.ItemView.extend({
     *        constructor: function NodeView(options) {
     *            options = options || {};
     *            options.model = new NodeModel({id: options.id}, options);
     *
     *            BlockingView.imbue(this);
     *        },
     *
     *        onRender: function() {
     *          this.blockAction(); // Blocker API that got mixed into this instance due to BlockingView.imbue() above
     *          this.model.fetch().always(this.unblockActions.bind(this));
     *        }
     *    });
     *
     *    return NodeView;
     * });
     *
     */
    imbue: function(view){
      BlockingViewImpl.imbue(view);
    },

    /**
     * Mix progress blocking APIs to a view where the blocker instance is delegated to a different view.
     *
     * Useful when there are more than one view instance with parent-child relationship such that each of the views want to mix
     * blocker APIs in it without creating duplicate blocker instances.
     * @param {external:Marionette.View} view - The view instance where blocking APIs are to be mixed.
     * @param {external:Marionette.View} delegateToView - The view which already has blocker APIs mixed and is going to be used as source of blocker instance.
     * @mixes BlockerAPI
     * @memberOf module:BlockingView
     * @example <caption>An item view showing/hiding blocker when its model syncs</caption>
     * define([
     *    'nuc/lib/marionette',
     *    'd2/sdk/controls/blocker/blocker'
     *    'd2/sdk/models/node.model',
     * ], function(Marionette, BlockingView, NodeModel){
     *    'use strict';
     *
     *    var NodeView = Marionette.ItemView.extend({
     *        constructor: function NodeView(options) {
     *            options = options || {};
     *            options.model = new NodeModel({id: options.id}, options);
     *
     *            BlockingView.delegate(this, options.parentView); // Assuming 'parentView' already has blocker API mixed to it
     *        },
     *
     *        onRender: function() {
     *          this.blockAction(); // Blocker API that got mixed into this instance due to BlockingView.imbue() above
     *          this.model.fetch().always(this.unblockActions.bind(this));
     *        }
     *    });
     *
     *    return NodeView;
     * });
     */
    delegate: function(view, delegateToView) {
      BlockingViewImpl.delegate(view, delegateToView);
    }
  };

  /**
   * Infuses the blocker APIs to a view instance.
   * @mixin BlockerAPI
   */

  /**
   * @name blockActions
   * @function
   * @description to be called on the view instance to show a blocker
   * @memberOf BlockerAPI#
   */

  /**
   * @name unblockActions
   * @function
   * @description to be called on the view instance to hide previously shown blocker
   * @memberOf BlockerAPI#
   */
});