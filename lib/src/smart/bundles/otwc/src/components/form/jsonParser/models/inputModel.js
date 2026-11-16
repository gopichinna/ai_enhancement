/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { FormElementBaseModel } from './formElementBaseModel.js';
import { formatAttributeData } from '../utilities.js';

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

  setData(schema, options, data) {
    super.setData(schema, options, data);

    const type = this.#getInputType(options);

    this.placeholder = formatAttributeData(options.placeholder);
    this.type = formatAttributeData(type);
    this.minLength = formatAttributeData(schema.minLength);
    this.maxLength = formatAttributeData(schema.maxLength);
    this.min = formatAttributeData(options.min);
    this.max = formatAttributeData(options.max);
    this.step = formatAttributeData(options.step);
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
