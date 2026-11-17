/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/table/cells/cell.registry'
], function(TableCellRegistryImpl){
  'use strict';

  /**
   * Register a new cell renderer, to be used for a specified column in a TableView or against a particular data type.
   *
   * @module {d2/sdk/controls/table/cells/cell.registry} d2/sdk/controls/table/cells/"cell.registry"
   * @name TableCellRegistry
   * @extends {Object}
   *
   */

  /**
   * @external TemplatedCellView
   * @see ./templated.cell.view
   */

  return {
    /**
     * Register a cell renderer by column key, i.e. an attribute name
     * @param {string} columnKey - Attribute name to bind this renderer to
     * @param {external:TemplatedCellView} handlerClass - View class implementing the renderer
     * @returns {void}
     * @static
     */
    registerByColumnKey: function (columnKey, handlerClass) {
      return TableCellRegistryImpl.registerByColumnKey(columnKey, handlerClass);
    },

    registerByOtherColumnKey: function(columnKey, handlerClass) {
      return TableCellRegistryImpl.registerByOtherColumnKey(columnKey, handlerClass);
    },

    /**
     * Register a renderer by data type
     * @param {number} dataType - A non-zero number to represent a data type. Pre-declared types are `-1(string)`, `-4(double)`, `-7(date)`, `2(integer)`, `5(boolean)`.
     * @param {external:TemplatedCellView} handlerClass - View class implementing the renderer
     * @returns {void}
     * @static
     */
    registerByDataType: function (dataType, handlerClass) {
      return TableCellRegistryImpl.registerByDataType(dataType, handlerClass);
    }
  };
});