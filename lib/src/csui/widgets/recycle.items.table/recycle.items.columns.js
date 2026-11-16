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
      return new TableColumnCollection(this.models?.map(column => {
        column.attributes;
      }));
    }
  });
  const RecycleItemsTableColumns = new TableColumnCollection([ {
    key: "type",
    sequence: 10
  }, {
    key: "name",
    sequence: 20
  }, {
    key: "deleted_date",
    sequence: 40
  }, {
    key: "deleted_user_name",
    sequence: 50
  }, {
    key: "created_by_user_name",
    sequence: 60
  }, {
    key: "size",
    sequence: 70
  }, {
    key: "parent_id",
    sequence: 80
  }, {
    key: "purged_date",
    sequence: 90
  } ]);
  return RecycleItemsTableColumns;
});