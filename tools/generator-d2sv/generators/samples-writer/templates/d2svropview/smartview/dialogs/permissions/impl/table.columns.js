define([
  'nuc/lib/backbone',
  'i18n!<%= namespace %>/dialogs/permissions/impl/nls/lang'
], function (Backbone, lang) {
  'use strict';

  var TableColumnModel = Backbone.Model.extend({
    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }
  });

  var TableColumnCollection = Backbone.Collection.extend({
    model: TableColumnModel,
    comparator: 'sequence',

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }
  });

  var tableColumns = new TableColumnCollection([
    {
      key: 'perm_owner',
      column_key: 'perm_owner',
      sequence: 2,
      definitions_order: 2,
      sort: false,
      title: lang.colNamePermissionOwner,
      type: -1,
      widthFactor: 0.7,
      permanentColumn: true, // don't wrap column due to responsiveness into details row
      isNaming: true
    },
    {
      key: 'base_permission',
      column_key: 'base_permission',
      sequence: 3,
      sort: false,
      definitions_order: 3,
      title: lang.colNameBasePermissions,
      type: -1,
      widthFactor: 0.7,
      permanentColumn: true // don't wrap column due to responsiveness into details row
    },
    {
      key: 'ext_permission',
      column_key: 'ext_permission',
      sort: false,
      sequence: 4,
      definitions_order: 4,
      title: lang.colNameExtPermissions,
      widthFactor: 1.5,
      type: -1,
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return tableColumns;
});
