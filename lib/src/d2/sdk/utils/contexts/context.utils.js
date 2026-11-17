/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/contexts/context.utils'
], function(ContextUtilsImpl){
  'use strict';

  /**
   * Utility to access `Context` object(s) associated with runtime.
   *
   * @todo Examples regular & unit test.
   *
   * @module {d2/sdk/utils/contexts/context.utils} d2/sdk/utils/contexts/"context.utils"
   * @name ContextUtil
   * @extends Object
   *
   */

  /**
   * @interface IContext
   * @ignore
   */

  /**
   * @interface PageContext
   * @extends Context
   *
   */

  /**
   * @interface PerspectiveContext
   * @extends Context
   */

  /**
   * @interface Context
   * @extends IContext
   */

  return {
    /**
     * Create and return a new `PageContext`. Useful while writing unit tests, where settin-up a `PerspectiveContext` is superflous.
     *
     * @returns {PageContext}
     * @memberOf module:ContextUtil
     */
    createPageContext: function () {
      return ContextUtilsImpl.createPageContext();
    },

    /**
     * Get the `PerspectiveContext` instance associated with runtime.
     *
     * @returns {PerspectiveContext}
     * @memberOf module:ContextUtil
     */
    getPerspectiveContext: function() {
      return ContextUtilsImpl.getPerspectiveContext();
    }
  };

  /* Documentation for interface Context */

  /**
   * @name isBusy
   * @function
   * @memberOf IContext#
   * @description Whether this context is still busy fetching the associated factories
   * @returns {boolean} `true` if still busy, `false` otherwise.
   */

  /**
   * @name isFetchable
   * @function
   * @memberOf IContext#
   * @description Whether a factory is fetchable in this context
   * @param {Factory} factory - The factory whose fetchability is being evaluated. See {@link ./factories/factory|Factory}.
   * @returns {boolean} `true` indicates the factory is fetchable.
   */

  /**
   * @name fetch
   * @function
   * @memberOf IContext#
   * @description Fetch all the factories associated with this context.
   * @param {object} options - options passed to each associated factories while fetching.
   * @returns {jQuery.Promise} the promise resolves when all the factories are fetched successfully.
   * @emits IContext#request
   * @emits IContext#sync
   * @emits IContext#error
   */

  /**
   * @name clear
   * @function
   * @memberOf IContext#
   * @description Destroy all factories associated with this context.
   * @param {object} options - options
   * @param {boolean} [options.all=false] - Whether to destroy all factories. By default only non-permanent factories are destroyed.
   * @returns {void}
   * @emits IContext#before:clear
   * @emits IContext#clear
   */

  /**
   * @name hasModel
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Backbone.Model` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name hasCollection
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Backbone.Collection` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name hasObject
   * @function
   * @memberOf IContext#
   * @description Whether a factory backed `Object` instance exists in this context.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {boolean}
   */

  /**
   * @name getModel
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Backbone.Model` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Backbone.Model} the model instance
   */

  /**
   * @name getCollection
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Backbone.Collection` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Backbone.Collection} the collection instance
   */

  /**
   * @name getObject
   * @function
   * @memberOf IContext#
   * @description Get a factory backed `Object` instance from this context. A new instance is created for the first time or when the factory options could not be
   * generally compared with the options from other pre-existing instances.
   * @param {(Factory|String)} factory - The factory which is responsible for creating the `Object` instance. See {@link ./factories/factory|Factory}. Or alternatively a factory name could be
   * specified as a `string`.
   * @param {Object} options - Options for the factory
   * @returns {Object} the instance
   */

  /**
   * @name destroy
   * @function
   * @memberOf IContext#
   * @description Destroy this context and all factories associated with it.
   * @returns {void}
   * @emits IContext#before:destroy
   * @emits IContext#destroy
   */

  /**
   * Context fetch started
   * @event IContext#request
   */

  /**
   * Context is fetched successfully.
   * @event IContext#sync
   */

  /**
   * Context is not fetched. It has failed due to error.
   * @event IContext#error
   */

  /**
   * Factories associated with this context are about to get destroyed.
   * @event IContext#before:clear
   */

  /**
   * Factories associated with this context are destroyed.
   * @event IContext#clear
   */

  /**
   * The context itself is about to be destroyed
   * @event IContext#before:destroy
   */

  /**
   * The context is destroyed along with associated factories
   * @event IContext#destroy
   */

  /* Documentation for interface Context */
});