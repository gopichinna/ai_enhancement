/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Model,
  Collection
} from "nuc/lib/backbone";

class TableColumnModel extends Model {
  idAttribute = "key";
  defaults() {
    return {
      key: null,
      sequence: 0
    };
  }
}

class TableColumnCollection extends Collection {
  model = TableColumnModel;
  comparator = "sequence";
  constructor(models, options = {}) {
    super(models, options);
  }
  getColumnKeys() {
    return this.pluck("key");
  }
  deepClone() {
    return new TableColumnCollection(this.map(function(colModel) {
      return colModel.attributes;
    }));
  }
}

const tableColumns = new TableColumnCollection([ {
  key: "_select",
  sequence: 1,
  permanentColumn: true,
  customization_resizeable: false,
  customization_pinned: true,
  customization_min_width: 32
} ]);

export default tableColumns;