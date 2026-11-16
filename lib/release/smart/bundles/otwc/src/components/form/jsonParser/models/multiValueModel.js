import { FormElementBaseModel } from './formElementBaseModel.js';
import { formatAttributeData } from '../utilities.js';
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

  #child = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.placeholder = formatAttributeData(options.placeholder);
    this.ariaLabel = formatAttributeData(options.ariaLabel);
    this.addLabel = formatAttributeData(options.addLabel);
    this.removeLabel = formatAttributeData(options.removeLabel);
    this.removeAriaLabel = formatAttributeData(options.removeAriaLabel);
    this.maxItems = formatAttributeData(schema.items.maxItems);
    this.value = Array.isArray(data) ? `[${data.map(item => `"${item || ''}"`)}]` : '[""]';

    this.#parseChildElement(schema, options);
  }

  #parseChildElement(schema, options) {
    const { type } = options.fields.item;

    let model;
    switch (type) {
      case TYPE_TEXTAREA:
        model = new TextAreaModel('otc-textarea');
        break;
      case TYPE_SELECT:
        model = new SelectModel('otc-select');
        break;
      case TYPE_INPUT_DATE:
      case TYPE_INPUT_DATE_TIME:
        model = new InputDateModel('otc-input-date');
        break;
      case TYPE_INPUT:
      case TYPE_TEXT:
      case TYPE_INTEGER:
      default:
        model = new InputModel('otc-input');
        break;
    }

    // Give the type down to child, so that it can detect the right type for input or input date.
    options.type = type;

    // Child element doesn't need infoMessage and label. The multi-value already has them.
    options.infoMessage = null;
    schema.label = null;
    options.label = null;

    model.setData(schema.items, options, null);

    this.#child = model;
  }

  get child() {
    return this.#child;
  }
}

export { MultiValueModel };
//# sourceMappingURL=multiValueModel.js.map
