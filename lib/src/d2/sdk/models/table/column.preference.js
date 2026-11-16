/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/models/table/column.preference'
], function(ColPrefModelImpl){
  'use strict';

  /**
   * Fetch or save column configuration associated with a particular widget config.
   *
   * @module {d2/sdk/models/table/column.preference} d2/sdk/models/table/"column.preference"
   * @name ColumnPreferenceModel
   * @extends {external:Backbone.Model}
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  var ColumnPreferenceModel = ColPrefModelImpl.extend({
    /**
     * Create a new instance.
     * @param {Object} attributes - column attributes
     * @param {Object} options - instance specific options
     * @param {Connector} options.connector - AJAX transport. See {@link ../../utils/contexts/factories/connector|Connector}.
     * @param {string} options.widgetType - Type of the widget config
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     */
    constructor: function ColumnPreferenceModel(attributes, options) {
      ColumnPreferenceModel.__super__.constructor.call(this, attributes, options);
    }
  });

  /**
   * @name fetch
   * @function
   * @description Fetch from server the column configuration of the widget identified by the set options
   * @returns {jQuery.Promise}
   * @instance
   */

  /**
   * @name save
   * @function
   * @description Save this column configuration to server
   * @returns {jQuery.Promise}
   * @instance
   */

  /**
   * @name columns
   * @type {Backbone.Collection}
   * @description Parsed column configuration such that each model in this collection represent a single column.
   * @instance
   */

  return ColumnPreferenceModel;
});