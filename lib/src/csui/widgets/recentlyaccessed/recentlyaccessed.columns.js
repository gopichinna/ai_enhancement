/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone" ], function(Backbone) {
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
  var RecentlyAccessedTableColumns = new TableColumnCollection([ {
    key: "type",
    titleIconInHeader: "mime_type",
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
    key: "parent_id",
    sequence: 40
  }, {
    key: "access_date_last",
    sequence: 50
  }, {
    key: "size",
    sequence: 60
  }, {
    key: "modify_date",
    sequence: 70
  }, {
    key: "favorite",
    sequence: 910,
    noTitleInHeader: true,
    permanentColumn: true
  } ]);
  return RecentlyAccessedTableColumns;
});