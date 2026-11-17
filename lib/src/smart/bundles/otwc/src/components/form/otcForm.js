/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html } from 'lit';
import { buildAttributesMarkup } from '../../utilities/common-utilities.js';
import { MODE_EDIT, TAG_NAME_OTC_INPUT, TAG_NAME_OTC_TEXTAREA, TAG_NAME_OTC_SELECT, TAG_NAME_OTC_INPUT_DATE, TAG_NAME_OTC_CHECKBOX, TAG_NAME_OTC_RADIO_GROUP, TAG_NAME_OTC_CHECKBOX_GROUP, TAG_NAME_OTC_MULTI_VALUE, MODE_INLINE_EDIT } from '../../utilities/jsonParser/jsonParser.constants.js';
import { FormParser } from '../../utilities/jsonParser/formParser.js';
import commonStyleSheet from '../../styles/common.scss.js';
import octFormStyle from './otcForm.scss.js';
import { ElementBase } from '../element-base.js';
import { ContainerModel } from '../../utilities/jsonParser/models/containerModel.js';
import { MultiValueModel } from '../../utilities/jsonParser/models/multiValueModel.js';
import { InlineEditContainerModel } from '../../utilities/jsonParser/models/inlineEditContainerModel.js';
import { CheckBoxModel } from '../../utilities/jsonParser/models/checkBoxModel.js';
import { unsafeHTML as o } from '../../../node_modules/lit-html/directives/unsafe-html.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * @prop {string} schema JSON string of the form schema
 * @prop {string} mode Show the form in different mode.<br>
 * Supported modes: `read`, `edit`, `inline-edit`.
 * @prop {string} columns The number of columns, which the element's content can break into.<br><br>
 * If there is no value given, the form will behave responsively.
 * The number of columns will be calculated dynamically based on the width of the screen
 * and the min-width definition for a form element of 176 px.
 * @prop {number} responsiveColumnWidth Define the column width in pixel for responsive mode.<br>
 * Has to be greater than the 100 px min-width definition to take effect.
 * When the form is in inline-edit-mode, 72 px will be added to this value.
 * @prop {HTMLFormElement} form The interface to the native <form> tag inside the Shadow DOM
 * @fires change Fired when the user modifies the element's value in the form.
 * The detail Object contains the actual form data and the instant of the element, which triggers the change event.
 */
class OtcForm extends ElementBase {
  /** @type {FormParser} */
  #form;

  #changeEventHandler = this.#triggerChangeEvent.bind(this);

  static get styles() {
    return [
      commonStyleSheet,
      octFormStyle,
    ];
  }

  static get properties() {
    return {
      schema: {
        type: String,
        reflect: true,
      },
      mode: {
        type: String,
        reflect: true,
      },
      columns: {
        type: Number,
        reflect: true,
      },
      responsiveColumnWidth: {
        type: Number,
        reflect: true,
      },
    };
  }

  constructor() {
    super();
    this.schema = '';
    this.mode = MODE_EDIT;
    this.columns = '';
    this.responsiveColumnWidth = 0;
  }

  /**
   * API method. Do not rename or delete!
   *
   * @returns {HTMLFormElement}
   */
  get form() {
    return this.shadowRoot.querySelector('form');
  }

  /**
   * API method. Do not rename or delete!
   *
   * @returns {FormData}
   */
  get data() {
    return new FormData(this.form);
  }

  /**
   * API method. Do not rename or delete!
   *
   * Return all supported elements inside the otc-form.
   *
   * @returns Array<Node>
   */
  get elements() {
    const elements = [];
    const selector = `
      ${TAG_NAME_OTC_INPUT}, 
      ${TAG_NAME_OTC_TEXTAREA},
      ${TAG_NAME_OTC_SELECT},
      ${TAG_NAME_OTC_INPUT_DATE},
      ${TAG_NAME_OTC_CHECKBOX},
      ${TAG_NAME_OTC_RADIO_GROUP},
      ${TAG_NAME_OTC_CHECKBOX_GROUP},
      ${TAG_NAME_OTC_MULTI_VALUE}
    `;
    const allElements = this.shadowRoot.querySelectorAll(selector);

    allElements.forEach((el) => {
      // Filter out the checkbox if it's used inside a checkbox-group.
      // Because the checkbox-group will present the checkbox.
      if (el.tagName === 'OTC-CHECKBOX' && el.parentElement.tagName === 'OTC-CHECKBOXGROUP') {
        return;
      }
      elements.push(el);
      elements[el.getAttribute('name')] = el;
    });

    return elements;
  }

  /**
   * API method. Do not rename or delete!
   *
   * Use to dynamical update the options of a select or a radio component.
   *
   * @param {string} data JSON String contains data for new options.
   * @param {string} id use to find an element with the ID inside the multi value.
   */
  updateOptions(data, id = '') {
    const formParser = new FormParser();
    // Changing option must be in edit mode.
    formParser.init('edit', data);

    formParser.items.forEach((item) => {
      const markup = item.optionsMarkup;
      const element = this.shadowRoot.querySelector(`[name="${item.name}"]`);

      let target;
      // If the select is used inside a multi value, then we need to find the select by its ID.
      if (element.tagName === 'OTC-MULTIVALUE' && id.length > 1) {
        target = element.shadowRoot.getElementById(id);
      } else { // Otherwise, the element is already the select
        target = element;
      }

      target.innerHTML = markup;

      if (target.getAttribute('istypeaheadsearch') !== null) {
        target.menuOpen = true;
      }
    });
  }

  /**
   * API method. Do not rename or delete!
   *
   * Show or hide not required fields.
   *
   * @param {Boolean} onlyRequired
   */
  showOnlyRequiredFields(onlyRequired = true) {
    for (const element of this.elements) {
      const isRequired = (element.getAttribute('required') !== null);
      const targetElement = element.closest('.otc-form__element');

      if (onlyRequired && !isRequired) {
        targetElement.setAttribute('hidden', '');
      } else if (!onlyRequired && !isRequired) {
        targetElement.removeAttribute('hidden');
      }
    }
  }

  /**
   * API method. Do not rename or delete!
   */
  validate() {
    this.reportValidity();
  }

  /**
   * API method. Do not rename or delete!
   *
   * @param {boolean} showErrorMessage
   * @returns {boolean}
   */
  checkValidity(showErrorMessage = true) {
    let isValid = true;
    for (const element of this.elements) {
      const elementValidity = element.checkValidity(showErrorMessage);

      if (!elementValidity) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * API method. Do not rename or delete!
   */
  reportValidity() {
    let isValid = true;
    for (const element of this.elements) {
      const elementValidity = element.reportValidity();

      if (!elementValidity) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * API method. Do not rename or delete!
   *
   * Wrapping a custom HTML Node in a DIV element and add to the form in the given position relative to an existing form field.
   *
   * @param {string} fieldName
   * @param {HTMLElement} customHTMLNode
   * @param {string} position
   */
  addCustomHTMLNode(fieldName, customHTMLNode, position = 'after') {
    const field = this.elements[fieldName];

    if (!field) {
      return;
    }

    const currentNode = field.parentNode;
    // Create new div with otc-form__element class to follow the form styling.
    const newElement = document.createElement('div');
    newElement.classList.add('otc-form__element');
    newElement.append(customHTMLNode);

    switch (position) {
      case 'before':
        currentNode.parentNode.insertBefore(newElement, currentNode);
        break;
      case 'after':
        currentNode.parentNode.insertBefore(newElement, currentNode.nextSibling);
        break;
    }
  }

  /**
   * Lit lifecycle method.
   *
   * @param changedProperties
   */
  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    const formParser = new FormParser();
    formParser.init(this.mode, this.schema);

    this.#form = formParser;
  }

  /**
   * Lit lifecycle method.
   *
   * @param _changedProperties
   */
  updated(_changedProperties) {
    super.updated(_changedProperties);

    this.updateComplete.then(() => {
      for (const element of this.elements) {
        this.#handleEvents(element);
      }

      this.dispatchEvent(new CustomEvent('update-completed', { detail: null, bubbles: true }));
    });
  }

  /**
   * Lit lifecycle method.
   *
   * @returns {*}
   */
  render() {
    const formClasses = {
      'otc-form': true,
      'otc-form--is-responsive': !this.columns,
      'otc-form--is-inline-edit': this.mode === MODE_INLINE_EDIT,
    };

    let style = '';
    // Only for responsive mode and the column width has to be greater than the min-width definition.
    if (!this.columns && this.responsiveColumnWidth > 100) {
      const columnWidth = this.mode !== MODE_INLINE_EDIT ? this.responsiveColumnWidth : this.responsiveColumnWidth + 72;
      style = `grid-template-columns: repeat(auto-fill, ${columnWidth}px);`;
    }

    return html`<form class="${e(formClasses)}" style="${style.length ? style : nothing}" action="${this.#getRenderValue(this.#form.attributes?.action)}" method="${this.#getRenderValue(this.#form.attributes?.method)}" target="${this.#getRenderValue(this.#form.attributes?.target)}" accept-charset="${this.#getRenderValue(this.#form.attributes?.acceptCharset)}">${this.columns
    ? this.#buildFixedColumnsLayout()
    : this.#form.items.map(element => (this.#buildItemMarkup(element)))
}</form>`;
  }

  /**
   * Add and remove event listener to a child element to react and trigger proper event from the otc-form.
   *
   * @param element
   */
  #handleEvents(element) {
    // Listen on 'saved' instead of 'change' event on inline edit container.
    if (element.parentElement.tagName === 'OTC-INLINE-EDIT-CONTAINER') {
      element.parentElement.removeEventListener('saved', this.#changeEventHandler);
      element.parentElement.addEventListener('saved', this.#changeEventHandler);
    } else {
      // First, remove all existed listeners on this element, to avoid duplicated event listener.
      element.removeEventListener('change', this.#changeEventHandler);
      element.addEventListener('change', this.#changeEventHandler);
    }
  }

  /**
   * Render markup for fixed columns layout.
   *
   * @returns {*}
   */
  #buildFixedColumnsLayout() {
    // Calculate the items per column base on the total items and column's amount.
    const itemsPerColumn = Math.ceil(this.#form.items.length / this.columns);

    const columns = [];
    const totalItems = this.#form.items;
    for (let i = 0; i < this.columns; i += 1) {
      // Get the exact number of items from total items to put into new column.
      const items = totalItems.splice(0, itemsPerColumn);
      columns.push(items);
    }

    return html`${columns.map(column => html`<div class="otc-form__column">${column.map(element => (this.#buildItemMarkup(element)))}</div>`)}`;
  }

  /**
   * Build the HTML markup for an item, which contains a form element.
   *
   * @param model
   * @returns
   */
  #buildItemMarkup(model) {
    if (model instanceof ContainerModel) {
      return html`<h4 class="otc-form__label">${model.title}</h4>${model.elements.map(element => o(this.#buildFormElementMarkup(element)))}`;
    }
    return o(this.#buildFormElementMarkup(model));
  }

  /**
   * Build the HTML markup for a form element.
   *
   * @param model
   * @param {boolean} isWrapperNeeded
   * @returns {string}
   */
  #buildFormElementMarkup(model, isWrapperNeeded = true) {
    if (model.hidden) {
      return '';
    }

    let markup = '';

    if (isWrapperNeeded) {
      markup += '<div class="otc-form__element">';
    }

    markup += `<${model.tagName} ${buildAttributesMarkup(model)}>`;

    // Build option markup for an element with options like otc-select or otc-radio.
    if (model.hasOptions) {
      markup += model.optionsMarkup;
    }

    // Single checkbox need a label in the slot.
    if (model instanceof CheckBoxModel) {
      markup += `${model.label}`;
    }

    if (model instanceof MultiValueModel) {
      markup += '<template>';
      markup += this.#buildFormElementMarkup(model.child, false);
      markup += '</template>';
    }

    if (model instanceof InlineEditContainerModel) {
      markup += this.#buildFormElementMarkup(model.child, false);
    }

    markup += `</${model.tagName}>`;

    if (isWrapperNeeded) {
      markup += '</div>';
    }

    return markup;
  }

  /**
   * Return a value for lit element rendering.
   *
   * @param attribute
   * @returns {*|typeof nothing|typeof nothing}
   */
  #getRenderValue(attribute) {
    return attribute !== null ? attribute : nothing;
  }

  /**
   * Trigger change event, which contains actual form's value.
   */
  #triggerChangeEvent(e) {
    const data = {};
    this.data.forEach((value, key) => {
      data[key] = value;
    });

    this.dispatchEvent(new CustomEvent('change', { detail: { value: data, target: e.target }, bubbles: true }));
  }
}

customElements.define('otc-form', OtcForm);

export { OtcForm };
//# sourceMappingURL=otcForm.js.map
