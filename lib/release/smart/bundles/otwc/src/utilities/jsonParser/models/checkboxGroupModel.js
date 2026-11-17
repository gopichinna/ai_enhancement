import { FormElementBaseModel } from './formElementBaseModel.js';

class CheckboxGroupModel extends FormElementBaseModel {
  #optionsMarkup = '';

  indeterminate = null;

  horizontal = null;

  get hasOptions() {
    return true;
  }

  get optionsMarkup() {
    return this.#optionsMarkup;
  }

  setData(schema, options, data) {
    super.setData(schema, options, data, false);

    this.indeterminate = this.formatAttributeData(options.indeterminate, true);
    this.horizontal = this.formatAttributeData(options.horizontal, true);

    this.#parseOptionsMarkup(schema, options, data);
  }

  #parseOptionsMarkup(schema, options, data) {
    const values = schema.enum ? schema.enum : [];
    const labels = options.optionLabels ? options.optionLabels : [];

    values.forEach((id, key) => {
      const label = labels[key] ? labels[key] : values[key];
      const checked = Array.isArray(data) && data.includes(id) ? 'checked' : '';

      this.#optionsMarkup += `<otc-checkbox id="${id}" ${this.indeterminate ? 'indeterminate' : ''} ${checked}>${label}</otc-checkbox>`;
    });
  }
}

export { CheckboxGroupModel };
//# sourceMappingURL=checkboxGroupModel.js.map
