/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { TAG_NAME_OTC_INPUT, TAG_NAME_OTC_INPUT_DATE, TAG_NAME_OTC_SELECT, TAG_NAME_OTC_TEXTAREA } from '../jsonParser.constants.js';
import { FormElementBaseModel } from './formElementBaseModel.js';
import { InputModel } from './inputModel.js';
import { TextAreaModel } from './textAreaModel.js';
import { SelectModel } from './selectModel.js';
import { InputDateModel } from './inputDateModel.js';

const TYPE_INPUT = 'input';
const TYPE_TEXT = 'text';
const TYPE_INTEGER = 'integer';
const TYPE_TEXTAREA = 'textarea';
const TYPE_SELECT = 'select';
const TYPE_INPUT_DATE = 'date';
const TYPE_INPUT_DATE_TIME = 'datetime';

class MultiValueModel extends FormElementBaseModel {
  placeholder = null;

  ariaLabel = null;

  addLabel = null;

  removeLabel = null;

  removeAriaLabel = null;

  maxItems = null;

  edit = null;

  validation = null;

  #child = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.placeholder = this.formatAttributeData(options.placeholder);
    this.ariaLabel = this.formatAttributeData(options.ariaLabel);
    this.addLabel = this.formatAttributeData(options.addLabel);
    this.removeLabel = this.formatAttributeData(options.removeLabel);
    this.removeAriaLabel = this.formatAttributeData(options.removeAriaLabel);
    this.maxItems = this.formatAttributeData(schema.items.maxItems);
    this.value = Array.isArray(data) ? `[${data.map(item => `"${item || ''}"`)}]` : '[""]';
    this.edit = this.formatAttributeData(options.edit, true);

    this.validation = this.formatAttributeData(JSON.stringify(options.validation));

    this.#parseChildElement(schema, options);
  }

  #parseChildElement(schema, options) {
    const { type } = options.fields.item;

    let model;
    switch (type) {
      case TYPE_TEXTAREA:
        model = new TextAreaModel(TAG_NAME_OTC_TEXTAREA);
        break;
      case TYPE_SELECT:
        model = new SelectModel(TAG_NAME_OTC_SELECT);
        break;
      case TYPE_INPUT_DATE:
      case TYPE_INPUT_DATE_TIME:
        model = new InputDateModel(TAG_NAME_OTC_INPUT_DATE);
        break;
      case TYPE_INPUT:
      case TYPE_TEXT:
      case TYPE_INTEGER:
      default:
        model = new InputModel(TAG_NAME_OTC_INPUT);
        break;
    }

    // Give the type down to child, so that it can detect the right type for input or input date.
    options.type = type;

    // Child element doesn't need infoMessage and label. The multi-value already has them.
    // Child element will have self-generated IDs.
    options.infoMessage = null;
    options.label = null;
    options.id = null;
    schema.label = null;

    model.setData(schema.items, options, null);

    this.#child = model;
  }

  get child() {
    return this.#child;
  }
}

export { MultiValueModel };
//# sourceMappingURL=multiValueModel.js.map
