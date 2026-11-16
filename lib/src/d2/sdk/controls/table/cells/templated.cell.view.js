/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/table/cells/templated/templated.view'
], function (TemplatedCellViewImpl) {
  'use strict';

  /**
   * Interface for classes that want to implement a table's cell view.
   *
   * After defining a new cell implementation, it has to be registered with `CellRegistry`.
   * If column is an attribute of custom type, then use custom type prefix before the column name(Example: custom_type.modified_info) and use the same for registering the cell view.
   * Created custom cell implementation module need to be included manually in other modules.
   * @see {@link ./cell.registry|TableCellRegistry}
   *
   * :::info
   * Limitation in table "List" mode
   *
   * When table is having more column, then columns which fits in viewport will be shown in the table row.
   * Rest of the columns will wrapped and shown as read only form. If the column is wrapped, then custom cell view won't be  rendered inside the form.
   * Custom Table cell will be rendered only in the visible table column.
   * :::
   *
   * @example
   * //In mybundle/table/cells/template/my.cell.hbs define the template as
   * <div class="my-cell-wrapper">
   *   <a class="my-cell-container" title="{{title}}">
   *      <span class="my-cell-data">{{data}}</span>
   *   </a>
   * </div>
   *
   * //Then in a cell implementation module
   * define([
   *  'nuc/lib/underscore',
   *  'd2/sdk/controls/table/cells/cell.registry',
   *  'd2/sdk/controls/table/cells/templated.cell.view',
   *  'hbs!mybundle/table/cells/my.cell'
   * ], function(_, CellRegistry, TemplatedCellView, template){
   *  'use strict';
   *
   *  var MyCellView = TemplatedCellView.extend({
   *    template: template,
   *    renderValue: function() {
   *      var tmplData = {
   *        data: this.options.column ? TemplatedCellView.getValue(this.model, this.options.column): '',
   *        title: this.getValueText()
   *      };
   *
   *      var html = '';
   *      if(!_.isEmpty(tmplData.data)) {
   *        tmplData.data = '' + tmplData.data;
   *        html = this.template(tmplData);
   *      }
   *
   *      this.$el.html(html);
   *    }
   *  });
   *  //Whenever a table is rendered where the backing collection has 'd2_custom_column' in its column definition, this cell view implementation willl be linked.
   *  CellRegistry.registerByColumnKey('d2_custom_column', MyCellView);
   *  //Use custom type prefix before the column name for custom type columns.
   *  CellRegistry.registerByColumnKey('cust_type.d2_custom_column', MyCellView);
   *  return MyCellView;
   * });
   *
   * // Then add Cell implementation module in startup.js
   * define([
   *   'mybundle/table/cell/modified.by/modified.by.view'
   * ], function(){
   *   'use strict';
   *
   *   return {
   *     beforeStartup: function() {},
   *     afterStartup: function() {}
   *   };
   * });
   *
   *
   * @module {d2/sdk/controls/table/cells/templated.cell.view} d2/sdk/controls/table/cells/"templated.cell.view"
   * @name TableCellView
   * @extends {external:Marionette.View}
   *
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  var TemplatedCellView = TemplatedCellViewImpl.extend({
    /**
     * @constructs
     * @name TemplatedCellView
     * @param {object} options - Constructor options. Following are the options specifically supported by the list apart from those from its supertype.
     * @param {*} options.column - Column definition for this table cell.
     *
     */
    constructor: function TemplatedCellView(options) {
      TemplatedCellView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name renderValue
   * @description Render the value associated with this cell. Contains logic to render and sytlize the corresponding DOM element
   * @returns {void}
   * @abstract
   */

  /**
   * @function
   * @name getValueText
   * @description Get renderable formatted value for this table cell. Same value will be considered while performing inline filter on the table. When Columns are wrapped, the same value will be displayed.
   * @returns {string}
   * @abstract
   */

  /**
   * @name columnClassName
   * @type {string}
   * @description CSS classname to be added for this column
   * @static
   */

  /**
   * @function
   * @name getValue
   * @decription Get value of this cell
   * @param {Backbone.Model} model - The model holding data for this cell
   * @param {*} column - Column definition of this cell.
   * @static
   */

  return TemplatedCellView;
});