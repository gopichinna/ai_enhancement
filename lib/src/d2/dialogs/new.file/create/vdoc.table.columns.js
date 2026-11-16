/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "i18n!d2/dialogs/new.file/create/impl/nls/lang" ], function(Backbone, lang) {
  var VdocTableColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var VdocTableColumnCollection = Backbone.Collection.extend({
    model: VdocTableColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new VdocTableColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  var vdocTableColumns = new VdocTableColumnCollection([ {
    key: "name",
    column_key: "name",
    sequence: 1,
    definitions_order: 1,
    sort: true,
    title: lang.nameColumnHeader,
    type: -1,
    permanentColumn: true,
    isNaming: true
  } ]);
  return vdocTableColumns;
});