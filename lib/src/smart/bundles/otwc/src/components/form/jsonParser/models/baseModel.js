/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
class BaseModel {
  id = null;

  hidden = false;

  #tagName = '';

  constructor(tagName = '') {
    this.#tagName = tagName;
  }

  get tagName() {
    return this.#tagName;
  }

  setData(options) {
    this.id = options?.id ? options.id : null;
    this.hidden = (!options?.hidden || options.hidden === 'false') ? null : true;
  }
}

export { BaseModel };
//# sourceMappingURL=baseModel.js.map
