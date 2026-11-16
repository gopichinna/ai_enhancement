/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { FormModel } from './models/formModel.js';
import { InputModel } from './models/inputModel.js';
import { TextAreaModel } from './models/textAreaModel.js';
import { SelectModel } from './models/selectModel.js';
import { RadioGroupModel } from './models/radioGroupModel.js';
import { InputDateModel } from './models/inputDateModel.js';
import { ContainerModel } from './models/containerModel.js';
import { MultiValueModel } from './models/multiValueModel.js';
import { InlineEditContainerModel } from './models/inlineEditContainerModel.js';
import { ToggleModel } from './models/toggleModel.js';
import { CheckboxGroupModel } from './models/checkboxGroupModel.js';

const TYPE_OBJECT = 'object';
const TYPE_ARRAY = 'array';
const TYPE_INPUT = 'input';
const TYPE_TEXTAREA = 'textarea';
const TYPE_SELECT = 'select';
const TYPE_RADIO = 'radio';
const TYPE_INPUT_DATE = 'date';
const TYPE_INPUT_DATE_TIME = 'datetime';

const TYPE_TOGGLE = 'toggle';
const TYPE_CHECKBOX = 'checkbox';
const TYPE_CHECKBOX_GROUP = 'checkbox-group';

const MODE_READ = 'read';
const MODE_INLINE_EDIT = 'inline-edit';

class JsonFormParser {
  #formSchema = {};

  #mode = '';

  /** @type {FormModel} */
  attributes;

  items = [];

  init(mode, jsonString) {
    this.#mode = mode;

    try {
      this.#formSchema = JSON.parse(jsonString);
    } catch (e) {
      return;
    }

    this.attributes = this.#parseFormAttributes();
    this.items = this.#parseFormElements(
      this.#formSchema.schema,
      this.#formSchema.options,
      this.#formSchema.data,
    );
  }

  #parseFormAttributes() {
    const options = this.#formSchema.options?.form?.attributes
      ? this.#formSchema.options.form.attributes
      : null;

    const model = new FormModel();
    model.setData(options);

    return model;
  }

  #parseFormElements(baseSchema, baseOptions, baseData) {
    const elements = [];
    const elementList = this.#getElementList(baseSchema);

    Object.entries(elementList).forEach(([elementName, schema]) => {
      const options = this.#getOptionsByElement(baseOptions, elementName);
      const data = this.#getDataByElement(baseData, elementName);

      let model;

      if (schema.type === TYPE_ARRAY) {
        model = new MultiValueModel('otc-multivalue', elementName);
      } else {
        switch (options.type) {
          case TYPE_OBJECT:
            model = new ContainerModel();
            model.setElements(this.#parseFormElements(schema, options, data));
            break;
          case TYPE_TEXTAREA:
            model = new TextAreaModel('otc-textarea', elementName);
            break;
          case TYPE_SELECT:
            model = new SelectModel('otc-select', elementName);
            break;
          case TYPE_RADIO:
            model = new RadioGroupModel('otc-radiogroup', elementName);
            break;
          case TYPE_INPUT_DATE:
          case TYPE_INPUT_DATE_TIME:
            model = new InputDateModel('otc-input-date', elementName);
            break;
          case TYPE_TOGGLE:
          case TYPE_CHECKBOX:
            model = new ToggleModel('otc-toggle', elementName);
            break;
          case TYPE_CHECKBOX_GROUP:
            model = new CheckboxGroupModel('otc-checkboxgroup', elementName);
            break;
          case TYPE_INPUT:
          default:
            model = new InputModel('otc-input', elementName);
            break;
        }
      }

      model.setData(schema, options, data);

      if (this.#mode === MODE_INLINE_EDIT && !(model instanceof ToggleModel || model instanceof ContainerModel)) {
        const inlineContainerModel = new InlineEditContainerModel();
        inlineContainerModel.setData(model);
        model = inlineContainerModel;
      } else if (this.#mode === MODE_READ) {
        model.readonly = true;
      }

      elements.push(model);
    });

    return elements;
  }

  #getElementList(schema) {
    return schema?.properties ? schema.properties : {};
  }

  #getOptionsByElement(options, elementName) {
    return options.fields[elementName] ? options.fields[elementName] : {};
  }

  #getDataByElement(data, elementName) {
    return (data && data[elementName] !== undefined) ? data[elementName] : null;
  }
}

export { JsonFormParser, MODE_INLINE_EDIT, MODE_READ };
//# sourceMappingURL=jsonFormParser.js.map
