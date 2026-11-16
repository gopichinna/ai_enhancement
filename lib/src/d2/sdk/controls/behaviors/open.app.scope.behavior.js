/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/behaviors/open.app.scope.behavior'
], function(OpenAppScopeBehaviorImpl){
  'use strict';

  /**
   * A `Marionette.view` behavior to navigate to an application scope perspective. Whichever view uses
   * this behavior, waits for a click event to happen. As a response to the click event, it opens the application
   * scope perspective.
   *
   * A view that has already mixed this behavior, can set a Boolean flag `disableAppScopeBehavior=true` to disable the behavior.
   *
   * @example <caption>To use this behavior in a sample view</caption>
   *
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/behaviors/open.app.scope.behavior',
   *  'd2/sdk/utils/contexts/context.utils'
   * ], function(Marionette, OpenAppScopeBehavior, contextUtil){
   *  'use strict';
   *
   *  var context = contextUtil.getPerspectiveContext();
   *
   *  var MyView = Marionette.LayoutView.extend({
   *    behaviors: {
   *      AppScope: {
   *        behaviorClass: OpenAppScopeBehavior,
   *        context: context,
   *        applicationScope: 'favorites'
   *      }
   *    },
   *    template: false,
   *    onRender: function() {
   *      this.$el.text('Click me to open favorites');
   *    }
   *  });
   * });
   *
   * @module {d2/sdk/controls/behaviors/open.app.scope.behavior} d2/sdk/controls/behaviors/"open.app.scope.behavior"
   * @name OpenAppScopeBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */
  var OpenAppScopeBehavior = OpenAppScopeBehaviorImpl.extend({

    /**
     * @constructs
     * @name OpenAppScopeBehavior
     * @alias module:OpenAppScopeBehavior
     * @param {object} options - Constructor options, automatically passed by Marionette from behavior configuration of a view
     * @param {string} options.applicationScope - Name of the application scope to be opened on click.
     * @param {Context} options.context - Reference to the runtime context. See {@link ../../utils/contexts/context.utils#Context|Context}.
     * @param {Boolean} [options.registerClickEventListener] - Whether the view should add a separate `click` event listener. Defaults to `true`.
     * Some views which has already added a click event listener on self element for some purpose, can be reused automatically for this behavior, in that case
     * this flag needs to be set to `false` explicitly.
     * @param {Marionette.View} view - The view instance associated with this behavior instance. Automatically set by Marionette.
     */
    constructor: function OpenAppScopeBehavior(options, view) {
      OpenAppScopeBehavior.__super__.constructor.call(this, options, view);
    }
  });

  return OpenAppScopeBehavior;
});