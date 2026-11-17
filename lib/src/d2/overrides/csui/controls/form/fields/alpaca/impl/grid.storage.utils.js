/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import Constants from "d2/utils/constants";

import widgetUtils from "d2/utils/widgets.utils";

import utils from "dctmw/utils/utils";

import _ from "nuc/lib/underscore";

const GRID_KEY_SEPEARTOR = "#", GRID_DIALOG_PREFIX = "DIALOG" + GRID_KEY_SEPEARTOR;

export default class GridUtils {
  static #GRID_STORAGE_KEY = Constants.StorageKey.GRID_SIZINGS;
  static #GRID_STORAGE = utils.getLocalStore(this.#GRID_STORAGE_KEY);
  static #getCurrentUsername() {
    return widgetUtils.getRepoUserName();
  }
  static getGridWidth(formId, gridKey) {
    let mem = this.#GRID_STORAGE.get(this.#getCurrentUsername()) || {};
    return mem && mem[formId] && mem[formId][gridKey];
  }
  static setGridWidth(storageKey, gridKey, gridSizes) {
    let mem = this.#GRID_STORAGE.get(this.#getCurrentUsername()) || {}, gridData = mem[storageKey] || {};
    gridData[gridKey] = gridSizes;
    mem[storageKey] = gridData;
    this.#GRID_STORAGE.set(this.#getCurrentUsername(), mem);
  }
  static getStorageKey(metadataView, propertyPageId) {
    propertyPageId = propertyPageId || "_DEFAULT_";
    const isWizard = !_.isUndefined(metadataView.options.wizard);
    return (isWizard ? GRID_DIALOG_PREFIX : "") + propertyPageId;
  }
  static buildGridId(itemsArr) {
    return itemsArr.join(GRID_KEY_SEPEARTOR);
  }
}