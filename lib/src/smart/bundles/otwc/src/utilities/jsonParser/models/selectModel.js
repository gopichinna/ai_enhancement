/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { FormElementBaseModel } from './formElementBaseModel.js';

const TYPE_SELECT_USER_ITEM = 'userItem';

class SelectModel extends FormElementBaseModel {
  placeholder = null;

  checkSelected = null;

  displayValue = null;

  maxItems = null;

  menuOpen = null;

  noneAriaLabel = null;

  noneLabel = null;

  disableNoneOption = null;

  disableFiltering = null;

  isTypeaheadSearch = null;

  autocomplete = null;

  edit = null;

  #optionsMarkup = '';

  get hasOptions() {
    return true;
  }

  get optionsMarkup() {
    return this.#optionsMarkup;
  }

  setData(schema, options, data) {
    super.setData(schema, options, data, false);

    this.placeholder = this.formatAttributeData(options.placeholder);
    this.checkSelected = this.formatAttributeData(options.checkSelected);
    this.displayValue = this.formatAttributeData(options.displayValue);
    this.maxItems = this.formatAttributeData(options.maxItems);
    this.menuOpen = this.formatAttributeData(options.menuOpen, true);
    this.noneAriaLabel = this.formatAttributeData(options.noneAriaLabel);
    this.noneLabel = this.formatAttributeData(options.noneLabel);
    this.disableNoneOption = this.formatAttributeData(options.disableNoneOption, true);
    this.disableFiltering = this.formatAttributeData(options.disableFiltering, true);
    this.isTypeaheadSearch = this.formatAttributeData(options.isTypeaheadSearch, true);
    this.autocomplete = this.formatAttributeData(options.autocomplete);
    this.edit = this.formatAttributeData(options.edit, true);

    if (options?.selectType === TYPE_SELECT_USER_ITEM) {
      this.#buildSelectUserItemOptionMarkup(schema, options, data);
    } else {
      this.#buildSelectItemOptionMarkup(schema, options, data);
    }
  }

  #buildSelectItemOptionMarkup(schema, options, data) {
    let values = [];
    let labels = [];

    if (options.dataSource && Array.isArray(options.dataSource)) {
      options.dataSource.forEach((item) => {
        values.push(item.value ? item.value : '');
        labels.push(item.text ? item.text : '');
      });
    } else {
      values = schema.enum ? schema.enum : [];
      labels = options.optionLabels ? options.optionLabels : [];
    }

    values.forEach((value, key) => {
      const label = labels[key] ? labels[key] : values[key];
      const selected = data === value ? 'selected' : '';

      this.#optionsMarkup += `<otc-selectitem value="${value}" ${selected}>${label}</otc-selectitem>`;
    });
  }

  #buildSelectUserItemOptionMarkup(schema, options, data) {
    let values = [];
    let labels = [];
    let images = [];
    let initials = [];

    if (options.dataSource && Array.isArray(options.dataSource)) {
      options.dataSource.forEach((item) => {
        values.push(item.value ? item.value : '');
        labels.push(item.text ? item.text : '');
        images.push(item.image ? item.image : '');
        initials.push(item.initial ? item.initial : '');
      });
    } else {
      values = schema.enum ? schema.enum : [];
      labels = options.optionLabels ? options.optionLabels : [];
      images = options.images ? options.images : [];
      initials = options.initials ? options.initials : [];
    }

    values.forEach((value, key) => {
      const label = labels[key] ? labels[key] : values[key];
      const selected = data === value ? 'selected' : '';

      let image = '';
      let initial = '';

      if (images[key] && images[key].length) {
        image = `image="${images[key]}"`;
      }

      if (initials[key] && initials[key].length) {
        initial = `initials="${initials[key]}"`;
      }

      this.#optionsMarkup += `<otc-selectuseritem value="${value}" ${selected} ${image} ${initial}>${label}</otc-selectuseritem>`;
    });
  }
}

export { SelectModel, TYPE_SELECT_USER_ITEM };
//# sourceMappingURL=selectModel.js.map
