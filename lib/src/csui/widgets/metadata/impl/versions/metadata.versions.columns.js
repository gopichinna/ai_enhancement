/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "i18n!csui/widgets/metadata/impl/nls/lang" ], function(Backbone, lang) {
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
    key: "version_number_name",
    align: "center",
    title: lang.versionColumnVersionNumberTitle,
    sequence: 10
  }, {
    key: "name",
    sequence: 20
  }, {
    key: "reserved",
    title: "State",
    sequence: 30,
    noTitleInHeader: true
  }, {
    key: "create_date",
    sequence: 50
  }, {
    key: "owner_id",
    sequence: 60
  }, {
    key: "file_size",
    align: "right",
    title: lang.versionColumnSizeTitle,
    sequence: 70
  } ]);
  return tableColumns;
});