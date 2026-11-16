import { FormElementBaseModel } from './formElementBaseModel.js';

class RadioGroupModel extends FormElementBaseModel {
  #optionsMarkup = '';

  get hasOptions() {
    return true;
  }

  get optionsMarkup() {
    return this.#optionsMarkup;
  }

  setData(schema, options, data) {
    super.setData(schema, options, data, false);
    this.#parseOptionsMarkup(schema, options, data);
  }

  #parseOptionsMarkup(schema, options, data) {
    const values = schema.enum ? schema.enum : [];
    const labels = options.optionLabels ? options.optionLabels : [];

    values.forEach((value, key) => {
      const label = labels[key] ? labels[key] : values[key];
      const checked = data === value ? 'checked' : '';

      this.#optionsMarkup += `<otc-radio value="${value}" ${checked}>${label}</otc-radio>`;
    });
  }
}

export { RadioGroupModel };
//# sourceMappingURL=radioGroupModel.js.map
