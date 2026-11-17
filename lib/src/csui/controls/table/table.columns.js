/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "i18n!csui/controls/table/impl/nls/lang", "i18n!csui/models/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.action.icons" ], function(Backbone, lang, modelLang, theming, jatoIcons) {
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
    key: "_select",
    sequence: 1,
    noTitleInHeader: true,
    title: lang.selectionColumnTitle,
    customization_resizeable: false,
    default_customization_width: () => theming.isJATOTheme() ? 40 : 32,
    customization_pinned: true
  }, {
    key: "order",
    sequence: 2,
    permanentColumn: true,
    customization_width: 75,
    customization_pinned: true
  }, {
    key: "type",
    sequence: 3,
    titleIconInHeader: "mime_type",
    titleSvgInHeader: jatoIcons.actionDocument,
    permanentColumn: true,
    customization_resizeable: false,
    default_customization_width: () => theming.isJATOTheme() ? 40 : 42,
    customization_pinned: true
  }, {
    key: "name",
    sequence: 4,
    permanentColumn: true,
    isNaming: true,
    customization_resize_span: "reserved",
    customization_min_width: 193,
    customization_width: 500,
    customization_pinned: true
  }, {
    key: "reserved",
    sequence: 5,
    title: modelLang.state,
    noTitleInHeader: true,
    customization_resizeable: false,
    customization_pinned: true
  }, {
    key: "size",
    sequence: null,
    customization_min_width: 105
  }, {
    key: "description",
    sequence: 890,
    is_default_column: false,
    customization_width: 192
  }, {
    key: "wnd_comments",
    sequence: 900,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false
  }, {
    key: "favorite",
    sequence: 910,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false
  } ]);
  return tableColumns;
});