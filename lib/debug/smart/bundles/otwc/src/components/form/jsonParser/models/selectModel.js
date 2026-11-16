import { FormElementBaseModel } from './formElementBaseModel.js';
import { formatAttributeData } from '../utilities.js';

const TYPE_SELECT_USER_ITEM = 'userItem';

class SelectModel extends FormElementBaseModel {
  placeholder = null;

  checkSelected = null;

  displayValue = null;

  maxItems = null;

  menuOpen = null;

  noneAriaLabel = null;

  noneLabel = null;

  showNone = null;

  #optionsMarkup = '';

  get hasOptions() {
    return true;
  }

  get optionsMarkup() {
    return this.#optionsMarkup;
  }

  setData(schema, options, data) {
    super.setData(schema, options, data, false);

    this.placeholder = formatAttributeData(options.placeholder);
    this.checkSelected = formatAttributeData(options.checkSelected);
    this.displayValue = formatAttributeData(options.displayValue);
    this.maxItems = formatAttributeData(options.maxItems);
    this.menuOpen = formatAttributeData(options.menuOpen, true);
    this.noneAriaLabel = formatAttributeData(options.noneAriaLabel);
    this.noneLabel = formatAttributeData(options.noneLabel);
    this.showNone = formatAttributeData(options.showNone, true);

    if (options?.selectType === TYPE_SELECT_USER_ITEM) {
      this.#buildSelectUserItemOptionMarkup(schema, options, data);
    } else {
      this.#buildSelectItemOptionMarkup(schema, options, data);
    }
  }

  #buildSelectItemOptionMarkup(schema, options, data) {
    const values = schema.enum ? schema.enum : [];
    const labels = options.optionLabels ? options.optionLabels : [];

    values.forEach((value, key) => {
      const label = labels[key] ? labels[key] : values[key];
      const selected = data === value ? 'selected' : '';

      this.#optionsMarkup += `<otc-selectitem value="${value}" ${selected}>${label}</otc-selectitem>`;
    });
  }

  #buildSelectUserItemOptionMarkup(schema, options, data) {
    const values = schema.enum ? schema.enum : [];
    const labels = options.optionLabels ? options.optionLabels : [];
    const images = options.images ? options.images : [];
    const initials = options.initials ? options.initials : [];

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
