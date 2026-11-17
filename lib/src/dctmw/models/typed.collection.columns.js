/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  injectedSyntheticColKey
} from "dctmw/controls/table/table.columns";

import CollectionColumns from "dctmw/models/collection.columns";

import ServerTypeModel from "dctmw/models/server.type.model";

class TypedCollectionColumns extends CollectionColumns {
  constructor(models, options = {}) {
    if (!(options.dataTypeModel instanceof ServerTypeModel)) {
      throw new Error(`TypedCollectionColumns cannot be initialized without ServerTypeModel`);
    }
    super(models, options);
    this.dataTypeModel = options.dataTypeModel;
  }
  isColumnsetCustomizable() {
    return this.filter(m => m.get("column_key") !== injectedSyntheticColKey).length > 1 || this.dataTypeModel.fetched && this.dataTypeModel.getDisplayableAttributeDefs().length > 1;
  }
}

Object.defineProperty(TypedCollectionColumns.prototype.constructor, "name", {
  value: "TypedCollectionColumns"
});

export default TypedCollectionColumns;