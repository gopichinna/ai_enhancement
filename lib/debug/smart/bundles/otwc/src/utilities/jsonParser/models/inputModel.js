import { FormElementBaseModel } from './formElementBaseModel.js';

const TYPE_TEXT = 'text';
const TYPE_NUMBER = 'number';
const TYPE_INTEGER = 'integer';

class InputModel extends FormElementBaseModel {
  placeholder = null;

  type = null;

  min = null;

  max = null;

  step = null;

  minLength = null;

  maxLength = null;

  whiteBackground = null;

  actionIcon = null;

  actionIconAriaLabel = null;

  actionIconTitle = null;

  edit = null;

  validation = null;

  autocomplete = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    const type = this.#getInputType(options);

    this.placeholder = this.formatAttributeData(options.placeholder);
    this.type = this.formatAttributeData(type);
    this.minLength = this.formatAttributeData(schema.minLength);
    this.maxLength = this.formatAttributeData(schema.maxLength);
    this.min = this.formatAttributeData(options.min);
    this.max = this.formatAttributeData(options.max);
    this.step = this.formatAttributeData(options.step);
    this.actionIcon = this.formatAttributeData(options.actionIcon);
    this.autocomplete = this.formatAttributeData(options.autocomplete);
    this.edit = this.formatAttributeData(options.edit, true);

    this.validation = this.formatAttributeData(JSON.stringify(options.validation));
  }

  #getInputType(options) {
    if (options.inputType) {
      return options.inputType;
    }

    if (options.type === TYPE_NUMBER || options.type === TYPE_INTEGER) {
      return TYPE_NUMBER;
    }

    return TYPE_TEXT;
  }
}

export { InputModel };
//# sourceMappingURL=inputModel.js.map
