/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/widgets/shortcut/shortcut.behavior'
], function(ShortcutBehaviorImpl){
  'use strict';

  /**
   * Interface for all classes that want to implement a shortcut tile's behavior.
   * Defines what should happen when user clicks on a particular shortcut tile in D2 Smart View landing perspective and also lets customize
   * appearance of the shortcut tile upto some extent.
   *
   * @example <caption>A new shortcut behavior url.shortcut.behavior.js could be defined as</caption>
   * define([
   *    'd2/sdk/widgets/shortcut.tile/shortcut.tile.behavior',
   *    'd2/sdk/utils/utils'
   * ], function(BaseShortcutBehavior, utils){
   *    'use strict';
   *
   *    var URLShortcutBehavior = BaseShortcutBehavior.extend({
   *        onClick: function() {
   *          if(this.options.data.url) {
   *            utils.openUrlInWindow(this.options.data.url, window.open(''));
   *          }
   *        }
   *    });
   *
   *    return URLShortcutBehavior;
   * });
   *
   * @example <caption>to register this shortcut behavior with ShortcutTileBehaviorCollection, add in extension.json</caption>
   * {
   *   "d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors": {
   *      "extensions": {
   *        "mybundle": {
   *          "mybundle/extensions/my.shortcut.behaviors"
   *        }
   *      }
   *    }
   * }
   *
   * @example <caption>where my.shortcut.behaviors.js is defined as</caption>
   * define([
   *    'mybundle/widgets/shortcut.tile/url.shortcut.behavior'
   * ], function(URLShortcutBehavior){
   *    'use strict';
   *
   *    // see 'ShortcutBehaviorType' documentation below for all possible properties and their usage.
   *    return [
   *      {type: 'OpenURLWidget', behaviorClass: URLShortcutBehavior}
   *      // Additional behaviors can also be registered
   *    ];
   * });
   *
   * @module {d2/sdk/widgets/shortcut.tile/shortcut.tile.behavior} d2/sdk/widgets/shortcut.tile/"shortcut.tile.behavior"
   * @name ShortcutTileBehavior
   * @extends {external:Marionette.Behavior}
   */

  /**
   * @external "Marionette.Behavior"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.behavior.html
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ShortcutTileBehavior = ShortcutBehaviorImpl.extend({
    constructor: function ShortcutTileBehavior() {
      ShortcutTileBehavior.__super__.constructor.apply(this, arguments);
    },

    /**
     * Marionette view lifecycle hook. It can be overriden to make any changes to the DOM element of the underlying shortcut view.
     * If overriden, it should call the `onRender` method of super type as the first thing. See example above.
     * @instance
     * @abstract
     */
    onRender: function() {
      ShortcutTileBehavior.__super__.onRender.apply(this, arguments);

      // Custom logic that can't be run until the short cut is visible in the UI
    },

    /**
     * Business logic to define what happens on click. It can be overriden to provide custom logic.
     * @instance
     * @abstract
     */
    onClick: function() {
      ShortcutTileBehavior.__super__.onClick.apply(this, arguments);

      // Custom code to do something awesome.
    }
  });

  /**
   * @name view
   * @type {external:Marionette.View}
   * @description reference to the shortcut's presentation
   * @instance
   */

  /**
   * @name viewModel
   * @type {external:Backbone.Model}
   * @description the model controlling the shortcut view
   * @instance
   */

  /**
   * @name context
   * @type {Context}
   * @description active application context
   * @see {@link ../../utils/contexts/context.utils#Context|Context}
   * @instance
   */

  /**
   * @name options
   * @type {Object}
   * @description Holder of parameters passed during shortcut construction. Has a normalized reference to the D2 Smart View landing page configuration behind this shortcut tile.
   * @instance
   */

  /**
   * Extension definition to link a shortcut behavior implementation with a shortcut tile type.
   * @typedef {Object} ShortcutBehaviorType
   * @property {string} type - Type of the shortcut tile.
   * @property {ShortcutTileBehavior} behaviorClass - The behavior implementation.
   * @property {number} [sequence=1000] - Priority of this behavior for the given `type`. Among all behaviors with matching `type` value, the one with lowest `sequence` is finally used.
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `ShortcutTileBehavior`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return ShortcutTileBehavior;
});