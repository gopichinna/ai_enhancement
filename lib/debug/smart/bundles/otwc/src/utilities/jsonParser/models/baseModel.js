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

  /**
   * Format an input to proper value
   *
   * @param value
   * @param isBooleanAttribute
   * @returns {*|null}
   */
  formatAttributeData(value, isBooleanAttribute = false) {
    if (!isBooleanAttribute) {
      return value !== undefined ? value : null;
    }

    return (value !== undefined && value === true) ? value : null;
  }
}

export { BaseModel };
//# sourceMappingURL=baseModel.js.map
