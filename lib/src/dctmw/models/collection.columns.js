/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Model,
  Collection
} from "nuc/lib/backbone";

import {
  injectedSyntheticColKey,
  typeColumnColKey
} from "dctmw/controls/table/table.columns";

import {
  columnCustomizationKeys
} from "dctmw/controls/table/table.view";

import utils from "dctmw/utils/utils";

import persistentStore from "dctmw/utils/persistent.store";

import TypedAttributeMapper from "dctmw/utils/typed.attribute.mapper";

const lang = {};

const colCustomizationKeyEventNames = _.map(columnCustomizationKeys, k => `change:customization_${k}`).filter(e => !!e).join(" ");

function getInjectablePinnedCol() {
  return {
    key: injectedSyntheticColKey,
    column_key: injectedSyntheticColKey,
    skipServerFetch: true
  };
}

class ColumnModel extends Model {
  idAttribute = "column_key";
  constructor(attr, options = {}) {
    if (attr && !attr.title) {
      attr.title = lang[attr.column_key];
    }
    if (attr?.isNaming === true || attr?.column_key === typeColumnColKey) {
      attr.default_action = _.isBoolean(attr.default_action) ? attr.default_action : true;
      if (attr.isNaming === true && options.makeNamingColumnPinned === true) {
        attr["permanentColumn"] = _.isBoolean(attr["permanentColumn"]) ? attr["permanentColumn"] : true;
        attr["customization_pinned"] = _.isBoolean(attr["customization_pinned"]) ? attr["customization_pinned"] : true;
        attr["customization_resizeable"] = _.isBoolean(attr["customization_resizeable"]) ? attr["customization_resizeable"] : false;
        attr["customization_min_width"] = _.isNumber(attr["customization_min_width"]) ? attr["customization_min_width"] : 200;
        attr["customization_width"] = _.isNumber(attr["customization_width"]) ? attr["customization_width"] : 280;
      }
    }
    super(attr, options);
  }
}

class Columns extends Collection {
  #prefStore;
  #showsTypeColumn;
  constructor(models, options = {}) {
    const showsTypeColumn = _.isBoolean(options.showsTypeColumn) ? options.showsTypeColumn : false;
    const prefPersistenceKey = utils.isNonEmptyString(options.prefPersistenceKey) ? options.prefPersistenceKey : false;
    let prefStore;
    if (prefPersistenceKey) {
      prefStore = persistentStore.getCollectionStore(prefPersistenceKey);
      if (prefStore.length && _.isArray(models) && models.length) {
        if (showsTypeColumn === false) {
          models = models.filter(m => {
            const mAttributes = m instanceof Model ? m.attributes : m;
            return mAttributes.column_key !== typeColumnColKey;
          });
        }
        models.forEach(m => {
          const mAttributes = m instanceof Model ? m.attributes : m;
          const prefModel = prefStore.findWhere({
            column_key: mAttributes["column_key"]
          });
          _.defaults(mAttributes, prefModel ? prefModel.attributes : {});
        });
      }
    }
    super(models, options);
    if (prefStore) {
      this.#prefStore = prefStore;
      this.listenTo(this, `reset update ${colCustomizationKeyEventNames}`, () => {
        const hasInjectedNamespanColumn = !!this.findWhere({
          column_key: injectedSyntheticColKey
        });
        this.#prefStore.reset(this.filter(m => m.get("column_key") !== injectedSyntheticColKey).map(m => {
          return _.omit(m.attributes, [ "type", "title", ...m.get("column_key") === "name" && hasInjectedNamespanColumn ? [ "customization_resize_span" ] : [] ]);
        }));
      });
    }
    this.#showsTypeColumn = showsTypeColumn;
  }
  hasPreference() {
    return !!this.#prefStore && this.#prefStore.length > 0;
  }
  getPreference() {
    return this.#prefStore ? this.#prefStore.toJSON() : [];
  }
  clearPreference() {
    this.#prefStore && this.#prefStore.reset([]);
    this.trigger("preferences:reset");
  }
  resetCollection(response, options) {
    let columns;
    if (response && response.columns) {
      let pinnedColCount = 0, lastPinIndex, cols = response.columns;
      this.#ensureTypeColumn(cols);
      cols.forEach((col, i) => {
        if (col["customization_pinned"] === true) {
          pinnedColCount++;
          lastPinIndex = i;
        } else if (col.isNaming === true && options.makeNamingColumnPinned === true) {
          pinnedColCount++;
          lastPinIndex = i;
        }
      });
      if (pinnedColCount === 1) {
        const injectedCol = getInjectablePinnedCol();
        const refSequence = cols[lastPinIndex].sequence;
        injectedCol["sequence"] = refSequence + 1;
        cols.forEach(col => {
          if (col.sequence > refSequence) {
            col.sequence += 1;
            if (_.isNumber(col.definitions_order) && !_.isNaN(col.definitions_order)) {
              col.definitions_order += 1;
            }
          }
        });
        if (lastPinIndex === cols.length - 1) {
          cols.push(injectedCol);
        } else {
          cols.splice(lastPinIndex + 1, 0, injectedCol);
        }
      }
      columns = cols.map(column => {
        return new this.model(column, options);
      });
    }
    this.reset(columns, options);
    this.fetched = true;
  }
  #ensureTypeColumn(columns) {
    if (this.#showsTypeColumn) {
      let idxTypeCol = -1;
      columns.some((col, i) => {
        if (col.column_key === typeColumnColKey) {
          idxTypeCol = i;
          return true;
        }
      });
      if (idxTypeCol === -1) {
        columns.unshift({});
        idxTypeCol = 0;
      }
      columns[idxTypeCol] = {
        column_key: typeColumnColKey,
        key: TypedAttributeMapper.constants.CLIENT_ATTR_NAME_TYPE
      };
    }
    return columns;
  }
}

Object.assign(Columns.prototype, {
  model: ColumnModel
});

export default Columns;