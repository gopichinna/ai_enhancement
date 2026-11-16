import { html, nothing } from 'lit';
import { JsonFormParser } from './jsonParser/jsonFormParser.js';
import commonStyleSheet from '../../styles/common.scss.js';
import octFormStyle from './otcForm.scss.js';
import { ElementBase } from '../element-base.js';
import { ContainerModel } from './jsonParser/models/containerModel.js';
import { MultiValueModel } from './jsonParser/models/multiValueModel.js';
import { InlineEditContainerModel } from './jsonParser/models/inlineEditContainerModel.js';
import { unsafeHTML as o } from '../../../node_modules/lit-html/directives/unsafe-html.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * @prop {string} schema JSON string of the form schema
 * @prop {string} mode Show the form in different mode.<br>
 * Supported modes: `read`, `edit`, `inline-edit`.
 * @prop {string} columns The number of columns, which the element's content can break into.<br><br>
 * If there is no value given, the form will behave responsively.
 * The number of columns will be calculated dynamically based on the width of the screen
 * and the min-width definition for a form element of 176px.
 * @prop {HTMLFormElement} form The interface to the native <form> tag inside the Shadow DOM
 * @fires change Fired when the user modifies the element's value in the form.
 */
class OtcForm extends ElementBase {
  /** @type {JsonFormParser} */
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
    };
  }

  constructor() {
    super();
    this.schema = '';
    this.mode = 'edit';
    this.columns = '';
  }

  /**
   *
   * @returns {HTMLFormElement}
   */
  get form() {
    return this.shadowRoot.querySelector('form');
  }

  get data() {
    return new FormData(this.form);
  }

  validate() {
    for (const element of this.form.elements) {
      element.reportValidity();
    }
  }

  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    const formParser = new JsonFormParser();
    formParser.init(this.mode, this.schema);

    this.#form = formParser;
  }

  updated(_changedProperties) {
    super.updated(_changedProperties);

    // Listen to the child element's change to trigger a change event fro
    this.updateComplete.then(() => {
      for (const element of this.form.elements) {
        // otc-radio and otc-checkbox are used in otc-radiogroup and otc-checkboxgroup, and they will send the change event.
        // So we don't have to listen to the change event, that comes directly from otc-radio and otc-checkbox
        if (element.tagName !== 'OTC-RADIO' && element.tagName !== 'OTC-CHECKBOX') {
          // First, remove all existed listeners on this element, to avoid duplicated event listener.
          element.removeEventListener('change', this.#changeEventHandler);
          element.addEventListener('change', this.#changeEventHandler);
        }
      }
    });
  }

  render() {
    const formClasses = {
      'otc-form': true,
      'otc-form--is-responsive': !this.columns,
      'otc-form--is-inline-edit': this.mode === 'inline-edit',
    };

    return html`<form class="${e(formClasses)}" action="${this.#getRenderValue(this.#form.attributes?.action)}" method="${this.#getRenderValue(this.#form.attributes?.method)}" target="${this.#getRenderValue(this.#form.attributes?.target)}" accept-charset="${this.#getRenderValue(this.#form.attributes?.acceptCharset)}">${this.columns
    ? this.#buildFixedColumnsLayout()
    : this.#form.items.map(element => (this.#buildItemMarkup(element)))
}</form>`;
  }

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

  #buildFormElementMarkup(model, isWrapperNeeded = true) {
    if (model.hidden) {
      return '';
    }

    let markup = '';

    if (isWrapperNeeded) {
      markup += '<div class="otc-form__element">';
    }

    markup += `<${model.tagName} ${this.#buildAttributesMarkup(model)}>`;

    // Build option markup for an element with options like otc-select or otc-radio.
    if (model.hasOptions) {
      markup += model.optionsMarkup;
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

  #buildAttributesMarkup(model) {
    let markup = '';

    Object.entries(model)
      .forEach(([key, value]) => {
        if (value !== null) {
          markup += `${key}='${value}' `;
        }
      });

    return markup;
  }

  #getRenderValue(attribute) {
    return attribute !== null ? attribute : nothing;
  }

  /**
   * Trigger change event, which contains actual form's value.
   */
  #triggerChangeEvent() {
    const data = {};
    this.data.forEach((value, key) => {
      data[key] = value;
    });

    this.dispatchEvent(new CustomEvent('change', { detail: { value: data }, bubbles: true }));
  }
}

customElements.define('otc-form', OtcForm);

export { OtcForm };
//# sourceMappingURL=otcForm.js.map
