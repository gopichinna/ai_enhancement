/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { Console } from '../logging-utilities.js';
import { TYPE_ARRAY, TAG_NAME_OTC_MULTI_VALUE, TAG_NAME_OTC_INPUT, TYPE_INPUT, TYPE_CHECKBOX_GROUP, TAG_NAME_OTC_CHECKBOX_GROUP, TYPE_CHECKBOX_V2, TAG_NAME_OTC_CHECKBOX, TYPE_CHECKBOX, TYPE_TOGGLE, TYPE_INPUT_DATE_TIME, TAG_NAME_OTC_INPUT_DATE, TYPE_INPUT_DATE, TYPE_RADIO, TAG_NAME_OTC_RADIO_GROUP, TYPE_SELECT, TAG_NAME_OTC_SELECT, TYPE_TEXTAREA, TAG_NAME_OTC_TEXTAREA, MODE_EDIT } from './jsonParser.constants.js';
import { FormModel } from './models/formModel.js';
import { MultiValueModel } from './models/multiValueModel.js';
import { TextAreaModel } from './models/textAreaModel.js';
import { SelectModel } from './models/selectModel.js';
import { RadioGroupModel } from './models/radioGroupModel.js';
import { InputDateModel } from './models/inputDateModel.js';
import { CheckBoxModel } from './models/checkBoxModel.js';
import { CheckboxGroupModel } from './models/checkboxGroupModel.js';
import { InputModel } from './models/inputModel.js';

/**
 * Parse data for a grid table, based on the JSON Schema.
 */
class DataGridParser {
  #jsonObject = {};

  #mode = '';

  /** @type {FormModel} */
  attributes;

  header = [];

  body = [];

  /**
   * Initialize the parser.
   *
   * @param {string} mode
   * @param {string} jsonString
   */
  init(mode, jsonString) {
    this.#mode = mode;

    try {
      this.#jsonObject = JSON.parse(jsonString);
    } catch (error) {
      Console.log(`Error by parsing JSON Schema: ${error.message}`);
      return;
    }

    this.#parseFormAttributes();
    this.#parseHeader();
    this.#parserBody();
  }

  /**
   * Parse data for form attributes, based on the JSON Schema.
   */
  #parseFormAttributes() {
    const options = this.#jsonObject.options?.form?.attributes
      ? this.#jsonObject.options.form.attributes
      : null;

    const model = new FormModel();
    model.setData(options);

    this.attributes = model;
  }

  /**
   * Parse data for table header, based on the JSON Schema.
   */
  #parseHeader() {
    this.#getHeaderItems(this.#jsonObject).forEach((item) => {
      this.header.push({ ...{ id: item[0] }, ...item[1] });
    });
  }

  /**
   * Parse data for table body, based on the JSON Schema.
   */
  #parserBody() {
    this.#getData(this.#jsonObject).forEach((cell) => {
      const row = [];

      this.header.forEach((item) => {
        const model = this.#getElementModel(item.id, item, this.#getOptionsForElement(item.id), cell[1][item.id]);
        row.push(model);
      });

      this.body.push(row);
    });
  }

  /**
   * Create and return the right model, based on the element's type from JSON Schema.
   *
   * @param elementName
   * @param schema
   * @param options
   * @param data
   * @returns {MultiValueModel|TextAreaModel|SelectModel|RadioGroupModel|InputDateModel|CheckBoxModel|CheckboxGroupModel|InputModel}
   */
  #getElementModel(elementName, schema, options, data) {
    let model;

    if (schema.type === TYPE_ARRAY) {
      model = new MultiValueModel(TAG_NAME_OTC_MULTI_VALUE, elementName);
    } else {
      switch (options.type) {
        case TYPE_TEXTAREA:
          model = new TextAreaModel(TAG_NAME_OTC_TEXTAREA, elementName);
          break;
        case TYPE_SELECT:
          model = new SelectModel(TAG_NAME_OTC_SELECT, elementName);
          break;
        case TYPE_RADIO:
          model = new RadioGroupModel(TAG_NAME_OTC_RADIO_GROUP, elementName);
          break;
        case TYPE_INPUT_DATE:
        case TYPE_INPUT_DATE_TIME:
          model = new InputDateModel(TAG_NAME_OTC_INPUT_DATE, elementName);
          break;
        case TYPE_TOGGLE:
        case TYPE_CHECKBOX:
        case TYPE_CHECKBOX_V2:
          model = new CheckBoxModel(TAG_NAME_OTC_CHECKBOX, elementName);
          break;
        case TYPE_CHECKBOX_GROUP:
          model = new CheckboxGroupModel(TAG_NAME_OTC_CHECKBOX_GROUP, elementName);
          break;
        case TYPE_INPUT:
        default:
          model = new InputModel(TAG_NAME_OTC_INPUT, elementName);
          break;
      }
    }

    options.autocomplete = 'off';

    if (model) {
      model.setData(schema, options, data);
    }

    model.initReadonly = model.readonly === true;

    if (this.#mode !== MODE_EDIT) {
      model.readonly = true;
    }

    return model;
  }

  #getHeaderItems(jsonObject) {
    const headerItems = jsonObject?.schema?.items?.properties ? jsonObject.schema.items.properties : {};

    return Object.entries(headerItems);
  }

  /**
   * Get data from the JSON Schema.
   *
   * @param {object} jsonObject
   * @returns {[]}
   */
  #getData(jsonObject) {
    const data = jsonObject?.data ? jsonObject.data : {};

    return Object.entries(data);
  }

  /**
   * Get options from the JSON Schema.
   *
   * @param {string} elementName
   * @returns {*}
   */
  #getOptionsForElement(elementName) {
    let options;
    Object.entries(this.#jsonObject.options.fields.item.fields).forEach((item) => {
      if (elementName === item[0]) {
        options = { ...{ interactiveOnly: true }, ...item[1] };
      }
    });

    return options;
  }
}

export { DataGridParser };
//# sourceMappingURL=dataGridParser.js.map
