/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/table/table.view'
], function(TableViewImpl){
  'use strict';

  /**
   * A `Marionette.view` to render `Backbone.Collection` data in tabular format.
   *
   * @module {d2/sdk/controls/table/table.view} d2/sdk/controls/table/"table.view"
   * @name TableView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external ToolitemsFactory
   * @see ../toolbar/toolitems.factory
   */

  var TableView = TableViewImpl.extend({

    /**
     * @constructs
     * @name TableView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {TableColumnCollection} options.tableColumns - Column definition. Each model must have `ColumnModel` attributes.
     * @param {TableColumnCollection} options.columns - Server side columns. Can be kept as same as `tableColumns`.
     * @prams {TableColumnCollection} options.thumbnailColumns] - Columns used while rendering items as thumbnails. Can be kept as same as `tableColumns`.
     * @param {Connector} options.connector - The connector instance.
     * @param {NodeCollection} options.collection - The collection holding data for the table.
     * @param {string[]} options.columnsWithSearch - Which columns should have search enabled on them.
     * @param {Marionette.View} options.originatingView - Reference to a parent view where this table is hosted.
     * @param {NodeCollection} options.selectedChildren - Collection to hold list of items selected.
     * @param {ToolitemsFactory} options.inlineBar - Toolbar configuration for this table items.
     * @param {string} options.selectRows - Row selection model. Set to 'none'.
     * @param {boolean} options.enableSorting - Enable column sorting
     * @param {object} [options.customLabels] - Customized state messages as follows
     * @param {string} [options.customLabels.emptySearchTable] - Shown when search in the table returns no result.
     * @param {string} [options.customLabels.zeroRecords] - Shown when the underlying collection has no items in it.
     */
    constructor: function TableView(options) {
      options = options || {};
      TableView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @typedef {Backbone.Collection} TableColumnCollection
   * @note Each TableColumnCollection must implement a method `getColumnKeys()` that returns the `key` attribute values from each of it's models
   * @note The model used for TableColumnCollection must use `key` as the `idAttribute`.
   * @example
   * define([
   *  'nuc/lib/backbone'
   * ], function(Backbone){
   *  'use strict';
   *
   *  var TableModel = Backbone.Model.extend({
   *    idAttribute: "key",
   *    defaults: {
   *      key: null,
   *      sequence: 0
   *    }
   *  });
   *
   *  var TableColumnCollection = Backbone.Collection.extend({
   *    model: TableColumnModel,
   *    comparator: 'sequence',
   *    getColumnKeys: function () {
   *      return this.pluck('key');
   *    }
   *  });
   *
   *  //Then finally an instance might look like
   *  var columnCollection = new TableColumnCollection([
   *    {
   *      key: 'attr1',
   *      column_key: 'attr1',
   *      sequence: 2, // Data column sequence should always start from 2, by design position 1 is reserved for displaying a selection checkbox.
   *      definitions_order: 2,
   *      sort: false,
   *      title: 'Cell 1',
   *      type: -1, //string data
   *      permanentColumn: true, //Don't wrap if screen size reduces
   *      isNaming: true
   *    },
   *    {
   *      key: 'attr2',
   *      column_key: 'attr2',
   *      sequence: 3,
   *      definitions_order: 3,
   *      sort: false,
   *      title: 'Cell 2',
   *      type: -1,
   *      permanentColumn: true,
   *      isNaming: true
   *    }
   *  ]);
   *
   *  return columnCollection;
   * });
   */

  /**
   * @typedef {Object} ColumnModel
   * @property {string} key - Data attribute name
   * @property {string} column_key - Column identifier. Usually kept similar to `key` above.
   * @property {number} sequence - Order of this model in the associated column collection
   * @property {number} definitions_order - Visible order of this column. Usually kept same as `sequence` above.
   * @property {boolean} sort - Enable sorting on this column
   * @property {string} title - Text to be displayed for this column
   * @property {number} type - data type associated with this column. See {@link ./cells/cell.registry|TableCellRegistry}.
   * @property {number} widthFactor - A decimal number to control this column's visual width in percentage.
   * @property {boolean} permanentColumn - Whether this is a permanent column. Permanent columns are not wrapped if screen size reduces.
   * @property {boolean} isNaming - Whether this is the naming column. At least one column should be marked as naming column in a column collection. Naming column
   * is where the table renders its inline actionbar, if configured any.
   */

  return TableView;
});