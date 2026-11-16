/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "d2/models/base.column.collection" ], function(Backbone, BaseCollections) {
  return new BaseCollections([ {
    key: "_select",
    sequence: 1,
    permanentColumn: true,
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
    key: "d2_inline_row_actions",
    sequence: 990,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false
  } ]);
});