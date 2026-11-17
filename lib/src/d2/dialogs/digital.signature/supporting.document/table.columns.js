/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "i18n!d2/dialogs/digital.signature/supporting.document/impl/nls/lang" ], function(Backbone, lang) {
  var TableColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var TableColumnCollection = Backbone.Collection.extend({
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
  var tableColumns = new TableColumnCollection([ {
    key: "type",
    column_key: "type",
    sequence: 2,
    definitions_order: 2,
    sort: false,
    repeating: false,
    title: lang.typeColumnHeader,
    type: -1,
    permanentColumn: true
  }, {
    key: "name",
    column_key: "name",
    sequence: 3,
    definitions_order: 3,
    sort: false,
    title: lang.nameColumnHeader,
    type: -1,
    widthFactor: 2,
    permanentColumn: true
  } ]);
  return tableColumns;
});