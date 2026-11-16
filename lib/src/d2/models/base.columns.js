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
    key: "favorite",
    sequence: 910,
    noTitleInHeader: true,
    permanentColumn: true,
    customization_resizeable: false
  } ]);
});