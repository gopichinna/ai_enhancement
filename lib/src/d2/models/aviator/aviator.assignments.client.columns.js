/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import lang from "i18n!d2/models/aviator/impl/nls/lang";

const clientColumns = [ {
  key: "_select",
  sequence: 1,
  permanentColumn: true,
  customization_resizeable: false,
  customization_pinned: true,
  customization_min_width: 32
}, {
  key: "name",
  column_key: "name",
  sequence: 2,
  definitions_order: 2,
  sort: true,
  title: lang.labelNameColumn,
  type: -1,
  permanentColumn: true,
  isNaming: true
}, {
  key: "embd_status",
  column_key: "embd_status",
  sequence: 3,
  definitions_order: 3,
  sort: true,
  title: lang.labelEmbeddingStatusColumn,
  type: -1,
  permanentColumn: true
}, {
  key: "enabled_user",
  column_key: "enabled_user",
  sequence: 4,
  definitions_order: 4,
  sort: true,
  title: lang.labelOwnedByColumn,
  type: -1,
  permanentColumn: true
}, {
  key: "embd_enabled_date",
  column_key: "embd_enabled_date",
  sequence: 5,
  definitions_order: 5,
  sort: true,
  title: lang.labelEnabledTimeColumn,
  type: -7,
  permanentColumn: true
} ];

export default clientColumns;