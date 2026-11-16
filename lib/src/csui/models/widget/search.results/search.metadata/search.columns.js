/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "i18n!csui/models/impl/nls/lang" ], function(_, Backbone, lang) {
  var metadataColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var metadataColumnCollection = Backbone.Collection.extend({
    model: metadataColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new metadataColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  var metadataColumns = new metadataColumnCollection([ {
    key: "_select",
    sequence: 0,
    customization_resizeable: false,
    customization_width: 32,
    customization_pinned: true
  }, {
    key: "OTMIMEType",
    sequence: 1,
    titleIconInHeader: "mime_type",
    customization_resizeable: false,
    customization_width: 42,
    customization_pinned: true,
    permanentColumn: true
  }, {
    key: "OTName",
    sequence: 2,
    permanentColumn: true,
    customization_min_width: 168,
    customization_width: 500,
    customization_pinned: true,
    customization_resize_span: "reserved",
    isNaming: true
  }, {
    key: "version_id",
    column_key: "version_id",
    title: lang.version,
    noTitleInHeader: true,
    permanentColumn: true,
    sequence: 3,
    customization_resizeable: false,
    customization_pinned: true
  }, {
    key: "reserved",
    column_key: "reserved",
    customization_resizeable: false,
    customization_pinned: true,
    sequence: 4,
    title: lang.state,
    noTitleInHeader: true,
    permanentColumn: true
  }, {
    key: "wnd_comments",
    column_key: "wnd_comments",
    sequence: 900,
    noTitleInHeader: true,
    title: lang.comment,
    permanentAtEnd: true,
    permanentColumn: true,
    customization_resizeable: false
  }, {
    key: "favorite",
    column_key: "favorite",
    customization_resizeable: false,
    sequence: 910,
    title: lang.favorite,
    noTitleInHeader: true,
    permanentAtEnd: true,
    permanentColumn: true
  } ]);
  return metadataColumns;
});