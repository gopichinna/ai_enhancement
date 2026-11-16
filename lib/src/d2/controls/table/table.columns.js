/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone" ], function(Backbone) {
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
  return new TableColumnCollection([ {
    key: "_select",
    sequence: 1,
    permanentColumn: true,
    customization_not_resizeable: true,
    customization_resizeable: false,
    customization_pinned: true,
    customization_min_width: 32
  }, {
    key: "type",
    sequence: 2,
    permanentColumn: true,
    customization_resizeable: false,
    customization_pinned: true,
    customization_min_width: 42
  }, {
    key: "name",
    sequence: 3,
    permanentColumn: true,
    customization_pinned: true,
    customization_width: 280,
    customization_resize_span: "reserved"
  }, {
    key: "d2_version_label",
    sequence: 5,
    permanentColumn: true,
    customization_pinned: true,
    customization_min_width: 160
  }, {
    key: "reserved",
    sequence: 6,
    permanentColumn: true,
    customization_resizeable: false,
    customization_pinned: true,
    customization_min_width: 40
  }, {
    key: "d2_external_share",
    sequence: 7,
    permanentColumn: true,
    customization_resizeable: false,
    customization_min_width: 32
  }, {
    key: "viewer_markup_count",
    sequence: 899,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false,
    customization_min_width: 40
  }, {
    key: "wnd_comments",
    sequence: 900,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false,
    customization_min_width: 40
  }, {
    key: "favorite",
    sequence: 910,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false
  } ]);
});