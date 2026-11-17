/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "csui/models/permission/permission.table.columns.model", "i18n!csui/widgets/permissions/impl/nls/lang" ], function(Backbone, TableColumnModel, lang) {
  let TableColumnCollection = Backbone.Collection.extend({
    model: TableColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new TableColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  let tableColumns = [ {
    key: "type",
    sequence: 10,
    titleIconInHeader: "mime_type",
    permanentColumn: true
  }, {
    key: "name",
    sequence: 20,
    title: lang.role,
    permanentColumn: true,
    containsInlineActions: true,
    isNaming: true
  }, {
    key: "dynamicpermissions",
    column_key: "dynamicpermissions",
    column_name: lang.permission_level,
    sequence: 40,
    permanentColumn: true
  }, {
    column_key: "addpermissions",
    key: "addpermissions",
    name: "",
    sortable: false,
    alignment: "center",
    permanentColumn: true,
    isToolbar: true,
    sequence: 999,
    className: "csui-inlinetoolbar-touch"
  } ];
  let tableColumnCollection = new TableColumnCollection(tableColumns);
  return tableColumnCollection;
});