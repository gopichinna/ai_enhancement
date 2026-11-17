/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  /**
   * @class ConnectableMixin
   * @mixin
   */
  var ConnectableMixin = {
    mixin: function (prototype) {
      var originalPrepareModel = prototype._prepareModel;

      return _.extend(
        prototype,
        /** @lends ConnectableMixin# */ {
          /**
           * connector
           * @memberof ConnectableMixin
           * @instance
           * @description The `Connector` instance assigned to this model or collection (object, read-only)
           */

          /**
         * @function
         * @param options {Object} - Recognized option properties:

         connector: The `Connector` instance to use.  If it is not provided, the connector has to
         be assigned at latest before the server is accessed or resource URL is computed.
         (object, `undefined` by default)

         * @returns {ConnectableMixin}
         * @description Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.


         */
          makeConnectable: function (options) {
            options && options.connector && options.connector.assignTo(this);
            return this;
          },

          /**
           * @function
           * @param attrs
           * @param options
           * @returns {*}
           * @private
           */
          _prepareModel: function (attrs, options) {
            options || (options = {});
            if (!options.connector) {
              options.connector = this.connector;
            }
            return originalPrepareModel.call(this, attrs, options);
          }
        }
      );
    }
  };

  return ConnectableMixin;
});
