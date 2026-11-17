import { Console } from '../logging-utilities.js';
import { MODE_INLINE_EDIT, MODE_READ, TYPE_ARRAY, TAG_NAME_OTC_MULTI_VALUE, TAG_NAME_OTC_INPUT, TYPE_INPUT, TYPE_CHECKBOX_GROUP, TAG_NAME_OTC_CHECKBOX_GROUP, TYPE_CHECKBOX_V2, TAG_NAME_OTC_CHECKBOX, TYPE_CHECKBOX, TYPE_TOGGLE, TYPE_INPUT_DATE_TIME, TAG_NAME_OTC_INPUT_DATE, TYPE_INPUT_DATE, TYPE_RADIO, TAG_NAME_OTC_RADIO_GROUP, TYPE_SELECT, TAG_NAME_OTC_SELECT, TYPE_TEXTAREA, TAG_NAME_OTC_TEXTAREA, TYPE_OBJECT } from './jsonParser.constants.js';
import { FormModel } from './models/formModel.js';
import { InputModel } from './models/inputModel.js';
import { TextAreaModel } from './models/textAreaModel.js';
import { SelectModel } from './models/selectModel.js';
import { RadioGroupModel } from './models/radioGroupModel.js';
import { InputDateModel } from './models/inputDateModel.js';
import { ContainerModel } from './models/containerModel.js';
import { MultiValueModel } from './models/multiValueModel.js';
import { InlineEditContainerModel } from './models/inlineEditContainerModel.js';
import { CheckBoxModel } from './models/checkBoxModel.js';
import { CheckboxGroupModel } from './models/checkboxGroupModel.js';

/**
 * Parse data for a form, based on the JSON Schema.
 */
class FormParser {
  #formSchema = {};

  #mode = '';

  /** @type {FormModel} */
  attributes;

  items = [];

  /**
   * Initialize the parser.
   *
   * @param {string} mode
   * @param {string} jsonString
   */
  init(mode, jsonString) {
    this.#mode = mode;

    try {
      this.#formSchema = JSON.parse(jsonString);
    } catch (error) {
      Console.log(`Error by parsing JSON Schema: ${error.message}`);
      return;
    }

    this.#parseFormAttributes();
    this.items = this.#parseFormElements(
      this.#formSchema.schema,
      this.#formSchema.options,
      this.#formSchema.data,
    );
  }

  /**
   * Parse data for form attributes, based on JSON Schema.
   */
  #parseFormAttributes() {
    const options = this.#formSchema.options?.form?.attributes
      ? this.#formSchema.options.form.attributes
      : null;

    const model = new FormModel();
    model.setData(options);

    this.attributes = model;
  }

  /**
   * Return a list of element model, which can be used in otcForm to render the form elements.
   *
   * @returns {*[]}
   */
  #parseFormElements(baseSchema, baseOptions, baseData) {
    const elements = [];
    const elementsForSorting = [];
    const elementList = this.#getElements(baseSchema);

    elementList.forEach(([elementName, schema]) => {
      const options = this.#getOptionsForElement(baseOptions, elementName);
      const data = this.#getDataForElement(baseData, elementName);

      let model = this.#getElementModel(elementName, schema, options, data);

      if (!model) {
        return;
      }

      if (this.#mode === MODE_INLINE_EDIT && !(model instanceof CheckBoxModel || model instanceof ContainerModel)) {
        const inlineEditContainerModel = new InlineEditContainerModel();
        inlineEditContainerModel.setData(model);
        model = inlineEditContainerModel;
      } else if (this.#mode === MODE_READ) {
        model.readonly = true;
      }

      if (options.order) {
        elementsForSorting.push({ order: options.order, model });
      } else {
        elements.push(model);
      }
    });

    if (elementsForSorting.length > 0) {
      return this.#sortingElements(elements, elementsForSorting);
    }

    return elements;
  }

  /**
   * Create and return the right model, based on the element's type from JSON Schema.
   *
   * @param {string} elementName
   * @param {object} schema
   * @param {object} options
   * @param {object} data
   * @returns {MultiValueModel|TextAreaModel|SelectModel|RadioGroupModel|InputDateModel|CheckBoxModel|CheckboxGroupModel|InputModel}
   */
  #getElementModel(elementName, schema, options, data) {
    let model;

    if (schema.type === TYPE_ARRAY) {
      model = new MultiValueModel(TAG_NAME_OTC_MULTI_VALUE, elementName);
    } else {
      switch (options.type) {
        case TYPE_OBJECT:
          model = new ContainerModel();
          model.setElements(this.#parseFormElements(schema, options, data));
          break;
        case TYPE_TEXTAREA:
          model = new TextAreaModel(TAG_NAME_OTC_TEXTAREA, elementName);
          break;
        case TYPE_SELECT:
          model = new SelectModel(TAG_NAME_OTC_SELECT, elementName);
          break;
        case TYPE_RADIO:
          if (this.#mode !== MODE_INLINE_EDIT) {
            model = new RadioGroupModel(TAG_NAME_OTC_RADIO_GROUP, elementName);
          }
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
          if (this.#mode !== MODE_INLINE_EDIT) {
            model = new CheckboxGroupModel(TAG_NAME_OTC_CHECKBOX_GROUP, elementName);
          }
          break;
        case TYPE_INPUT:
        default:
          model = new InputModel(TAG_NAME_OTC_INPUT, elementName);
          break;
      }
    }

    if (model) {
      model.setData(schema, options, data);
    }

    return model;
  }

  /**
   * Sort the elements by order and put them before elements without an order.
   *
   * @param elements
   * @param elementsForSorting
   * @returns {*[]}
   */
  #sortingElements(elements, elementsForSorting) {
    elementsForSorting.sort((a, b) => a.order - b.order);

    const elementsWithOrdering = [];
    elementsForSorting.forEach((el) => {
      elementsWithOrdering.push(el.model);
    });

    return [...elementsWithOrdering, ...elements];
  }

  /**
   * Get all form elements from the JSON Schema.
   *
   * @returns []
   * @param {object} schema
   */
  #getElements(schema) {
    const properties = schema?.properties ? schema.properties : {};

    return Object.entries(properties);
  }

  /**
   * Get options from the JSON Schema for the form element.
   *
   * @param {object}options
   * @param {string} elementName
   * @returns {*|{}}
   */
  #getOptionsForElement(options, elementName) {
    return options.fields[elementName] ? options.fields[elementName] : {};
  }

  /**
   * Get data from the JSON Schema for the form element.
   *
   * @param {object} data
   * @param {string} elementName
   * @returns {*|null}
   */
  #getDataForElement(data, elementName) {
    return (data && data[elementName] !== undefined) ? data[elementName] : null;
  }
}

export { FormParser };
//# sourceMappingURL=formParser.js.map
