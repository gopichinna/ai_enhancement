/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "i18n!d2/dialogs/new.file/create/impl/nls/lang" ], function(Backbone, lang) {
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
    key: "template_object_name",
    column_key: "template_object_name",
    sequence: 3,
    definitions_order: 3,
    sort: true,
    title: lang.nameColumnHeader,
    type: -1,
    widthFactor: 1.2,
    permanentColumn: true,
    isNaming: true
  }, {
    key: "template_title",
    column_key: "template_title",
    sequence: 4,
    sort: true,
    definitions_order: 4,
    title: lang.titleColumnHeader,
    type: -1,
    permanentColumn: true
  }, {
    key: "template_subject",
    column_key: "template_subject",
    sort: true,
    sequence: 5,
    definitions_order: 5,
    title: lang.subjectColumnHeader,
    type: -1,
    permanentColumn: true
  } ]);
  return tableColumns;
});