/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model,
  Collection
} from "nuc/lib/backbone";

const lang = {};

class ColumnModel extends Model {
  idAttribute = null;
  constructor(attr, options = {}) {
    if (attr && !attr.title) {
      attr.title = lang[attr.column_key];
    }
    if (attr?.isNaming === true || attr?.column_key === "type") {
      attr.default_action = _.isBoolean(attr.default_action) ? attr.default_action : true;
    }
    super(attr, options);
  }
}

class Columns extends Collection {
  model = ColumnModel;
  constructor(models, options = {}) {
    super(models, options);
  }
  resetCollection(response, options) {
    let columns;
    if (response && response.columns) {
      columns = response.columns.map(column => {
        return new this.model(column);
      });
    }
    this.reset(columns, options);
    this.fetched = true;
  }
}

export default Columns;