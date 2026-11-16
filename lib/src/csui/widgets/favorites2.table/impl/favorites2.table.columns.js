/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "i18n!csui/widgets/favorites2.table/impl/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
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
    },
    resetCollection: function(columns, options) {
      if (columns) {
        var sequence = 0;
        var models = _.map(columns, function(column) {
          var columnData = column instanceof Backbone.Model ? column.toJSON() : column;
          sequence += 10;
          return new TableColumnModel(_.defaults(columnData, {
            key: columnData.column_key,
            sequence: sequence
          }));
        });
        this.reset(models, options);
      }
    }
  });
  var tableColumns = new TableColumnCollection([ {
    key: "type",
    titleIconInHeader: "mime_type",
    sequence: 10,
    permanentColumn: true
  }, {
    key: "favorite_name",
    title: lang.favoriteColumnNameTitle,
    cellViewClassname: "csui/controls/table/cells/name.view",
    sequence: 20,
    permanentColumn: true,
    isNaming: true
  }, {
    key: "reserved",
    sequence: 30,
    noTitleInHeader: true
  }, {
    key: "parent_id",
    sequence: 40
  }, {
    key: "favorite",
    sequence: 910,
    noTitleInHeader: true,
    permanentColumn: true
  } ]);
  return tableColumns;
});