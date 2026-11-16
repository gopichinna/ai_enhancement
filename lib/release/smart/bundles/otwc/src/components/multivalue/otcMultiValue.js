import { html } from 'lit';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import otcMultiValueStyle from './otcMultiValue.scss.js';
import { sformat } from '../../utilities/common-utilities.js';
import { getSVGForIcon, OTC_ICON_BUNDLE_WC_ACTION_SMALL } from '../../utilities/render-utilities.js';
import '../../../lib/otc-icons/icons_otc-action_small.js';
import { unsafeHTML as o } from '../../../node_modules/lit-html/directives/unsafe-html.js';

/**
 * The Multi Value component is a specific form element that provides the possibility to have multi items of a specific otc form elements
 * such as `otc-input`, `otc-textarea`, `otc-select` and `otc-input-date`.
 * @prop {string} addLabel Alternative label text for the add new value button.
 * @prop {string[]} displayValue The display value of the form element.
 * @prop {string} maxItems Defines the maximum number of items/values to be in the field. If unset, then there is no limitation on the
 * number of items.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the Input has no value.
 * @prop {string} removeAriaLabel The aria-label for the remove value button. The text should contain a {0} placeholder for the actual value
 * to remove.
 * @prop {string} removeLabel The label text for the remove value button.
 * @prop {string[]} value Defines the array values for the input elements. The number of rendered fields corresponds to the amount of the
 * value array. If the value is not set, one field will be rendered.
 * @slot template Defines the template that will be used for rendering the content of the multi value. **Note:** The attributes of the multi
 * value component will be propagated and overwrite the attribute of the input component. So you should define only those attributes, that
 * are not supported by the component such as `minlength` or `maxlength`.
 */
class OtcMultiValue extends FormBase {
  #displayValue = [];

  #firstUpdated = true;

  #valueChangedHandler = this._handleValueChanged.bind(this);

  #focusInHandler = this._showActionButtonsForElement.bind(this);

  #focusOutHandler = this._hideActionButtonsForElement.bind(this);

  #openHandler = this._handleMenuOpen.bind(this);

  #closeHandler = this._handleMenuClose.bind(this);

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      FormBase.getFormStyles(),
      buttonStyleSheet,
      otcMultiValueStyle,
    ];
  }

  static get properties() {
    const props = {
      addLabel: { type: String, reflect: true },
      displayValue: { type: Array, reflect: false },
      maxItems: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      removeAriaLabel: { type: String, reflect: true },
      removeLabel: { type: String, reflect: true },
      value: { type: Array, reflect: false },
    };

    return { ...FormBase._baseProperties, ...props };
  }

  constructor() {
    super();

    this.addLabel = 'Add value';
    this.displayValue = [''];
    this.maxItems = '';
    this.placeholder = '';
    this.removeAriaLabel = 'Remove value: {0}';
    this.removeLabel = 'Remove value';
    this.value = [''];
  }

  /**
   * Return all supported child elements in the shadow DOM.
   *
   * @returns {NodeListOf<Element>}
   * @private
   */
  _getAllChildElements() {
    return this.shadowRoot.querySelectorAll('otc-input, otc-textarea, otc-select, otc-input-date');
  }

  /**
   * Update the value property in such a way that Lit will not notice the change and cause a re-rendering.
   *
   * @param {Array} newValue
   * @param {Array} displayValue
   *
   * @private
   */
  _updateValue(newValue, displayValue) {
    this.value = [].concat(newValue);
    this.displayValue = [].concat(displayValue);
    this.#displayValue = [].concat(displayValue);

    this.setInternalsFormValue(this.value.toString());
  }

  /**
   * Remove all event listeners from the child elements.
   *
   * @private
   */
  _removeAllEventListenersForChildElements() {
    for (const element of this._getAllChildElements()) {
      this.#removeEventsForElement(element);
    }
  }

  #removeEventsForElement(element) {
    element.removeEventListener('input', this.#valueChangedHandler);
    element.removeEventListener('change', this.#valueChangedHandler);
    element.removeEventListener('value-changed', this.#valueChangedHandler);
    element.removeEventListener('open', this.#openHandler);
    element.removeEventListener('close', this.#closeHandler);
    element.parentElement.removeEventListener('focusin', this.#focusInHandler);
    element.parentElement.removeEventListener('focusout', this.#focusOutHandler);
  }

  /**
   * Add a new element with position next to the index in the value array.
   *
   * @param {number} index
   * @private
   */
  _addNewElement(index) {
    this._removeAllEventListenersForChildElements();

    // Add a new element to the value array at the position right after the index.
    const newValue = this.value;
    newValue.splice(index + 1, 0, '');

    const newDisplayValue = this.displayValue;
    newDisplayValue.splice(index + 1, 0, '');

    this._updateValue(newValue, newDisplayValue);
    // focus on the new item, once it is complete
    this.item2Focus = index + 1;

    // Trigger change event to inform of value change.
    this.triggerChangeEvent({ type: 'ELEMENT_ADDED', value: this.value });
  }

  /**
   * Remove an element at the index from the value array.
   *
   * @param {number} index
   * @private
   */
  _removeElement(index) {
    this._removeAllEventListenersForChildElements();

    // Remove the element from the value array at position of the index.
    const newValue = this.value;
    newValue.splice(index, 1);

    const newDisplayValue = this.displayValue;
    newDisplayValue.splice(index, 1);

    this._updateValue(newValue, newDisplayValue);

    // focus the item before the deleted one
    this.item2Focus = index > 0 ? index - 1 : 0;

    // Trigger change event to inform of value change.
    this.triggerChangeEvent({ type: 'ELEMENT_REMOVED', value: this.value });
  }

  /**
   * Show action buttons for a single element.
   *
   * @param {Event} event
   * @private
   */
  _showActionButtonsForElement(event) {
    event.target.parentElement.classList.add('ot-multi-value__item--is-focused');
  }

  /**
   * Hide action buttons for a single element.
   *
   * @param {Event} event
   * @private
   */
  _hideActionButtonsForElement(event) {
    if (!event.target.parentElement.matches(':focus-within')) {
      event.target.parentElement.classList.remove('ot-multi-value__item--is-focused');
    }
  }

  /**
   * Handle when the element's value is changed.
   *
   * @private
   */
  _handleValueChanged(event) {
    const element = event.target;
    const elementIndex = this.#findElementIndex(element);

    // find the removeButton first
    let removeButton = element.nextElementSibling;
    if (removeButton && !removeButton.classList.contains('ot-multi-value__remove-button')) {
      removeButton = removeButton.nextElementSibling;
    }
    if (removeButton) {
      const value4RemoveAria = element.displayValue ? element.displayValue : element.value;
      removeButton.setAttribute('aria-label', sformat(this.removeAriaLabel, value4RemoveAria));
      removeButton.setAttribute('title', `${this.removeLabel}`);
    }

    this._handleButtonPosition(element);

    this.#updateValue(elementIndex, element);

    // Pass through the change event.
    if (event.type === 'change') {
      this.triggerChangeEvent();
    } else if (event.type === 'value-changed') {
      this.dispatchEvent(new CustomEvent('value-changed', { detail: null, bubbles: true }));
    }
  }

  // Return the index of an element in the element child list.
  #findElementIndex(element) {
    let index = 0;
    let i = 0;
    for (const childElement of this._getAllChildElements()) {
      if (childElement.id === element.id) {
        index = i;
      }
      i += 1;
    }

    return index;
  }

  /**
   * Build a component markup with proper attributes.
   *
   * @param index
   * @param {Element} element
   * @returns {string}
   * @private
   */
  _updateElement(index, element) {
    // First, remove all existed listeners on this element, to avoid duplicated event listener.
    this.#removeEventsForElement(element);

    element.addEventListener('input', this.#valueChangedHandler);
    element.addEventListener('change', this.#valueChangedHandler);
    element.addEventListener('value-changed', this.#valueChangedHandler);
    element.addEventListener('open', this.#openHandler);
    element.addEventListener('close', this.#closeHandler);
    element.parentElement.addEventListener('focusin', this.#focusInHandler);
    element.parentElement.addEventListener('focusout', this.#focusOutHandler);

    this._updateElementValue(element, this.value[index]);

    element.setAttribute('placeholder', this.placeholder);
    element.setAttribute('ariaLabel', this.ariaLabel ? this.ariaLabel : this.label);
    element.setAttribute('role', 'none');
    element.setAttribute('caretRightSpacingLarge', true);

    if (this.disabled) {
      element.setAttribute('disabled', 'disabled');
    } else {
      element.removeAttribute('disabled');
    }

    if (this.required) {
      element.setAttribute('required', 'required');
    } else {
      element.removeAttribute('required');
    }

    if (this.readonly) {
      element.setAttribute('readonly', 'readonly');
    } else {
      element.removeAttribute('readonly');
    }

    this._handleButtonPosition(element);
  }

  /**
   * Update the value array without trigger the re-rendering.
   *
   * @param {number} index
   * @param {Element} element
   */
  #updateValue(index, element) {
    this.value[index] = element.value;
    this.displayValue[index] = element.displayValue;
    this.#displayValue[index] = element.displayValue;

    this.setInternalsFormValue(this.value.toString());
  }

  /**
   *
   * @param {Element} element
   * @param {string} value
   * @private
   */
  _updateElementValue(element, value) {
    if (!element.validity?.valid) {
      return;
    }

    if (this.#firstUpdated && this.value.length === 1 && this.value[0] === '') {
      return;
    }

    element.setAttribute('value', value);
  }

  /**
   * Handle the button's position for textarea.
   *
   * Because the textarea can have different height based on its rows,
   * and the add/remove button should always be placed to the bottom/center of the textarea,
   * The position of the buttons must be calculated.
   * So that it stays in the right position as UX designed.
   *
   * @param element
   * @private
   */
  _handleButtonPosition(element) {
    if (element.tagName === 'OTC-TEXTAREA') {
      const addButton = element.parentElement.querySelector('.ot-multi-value__add-button');
      const removeButton = element.parentElement.querySelector('.ot-multi-value__remove-button');
      const textAreaHeight = element.shadowRoot.querySelector('textarea').offsetHeight;

      // The icon is 17px height and to position the added button in the bottom of the textarea, the calculation 81px -17px is needed.
      if (addButton) {
        addButton.style.top = `${textAreaHeight - 17}px`;
      }

      // Calculate the position to put the remove button in the center right of the textarea.
      if (removeButton) {
        removeButton.style.top = `${(textAreaHeight - 28) / 2}px`;
      }
    }
  }

  /**
   * Add css class to hide action item, when the menu is open.
   * @param {Event} event
   * @private
   */
  _handleMenuOpen(event) {
    event.target.closest('.ot-multi-value__item').classList.add('ot-multi-value__item--is-open');
  }

  /**
   * Remove CSS to show action item, when the menu is close.
   * @param {Event} event
   * @private
   */
  _handleMenuClose(event) {
    event.target.closest('.ot-multi-value__item').classList.remove('ot-multi-value__item--is-open');
  }

  /**
   * Returns an HTML template literal of the template markup.
   * @private
   */
  #getTemplateMarkup() {
    const templateNode = this.getElementsByTagName('TEMPLATE');
    const templateMarkup = (templateNode.length && templateNode[0]) ? templateNode[0].innerHTML : '';

    return o(templateMarkup);
  }

  /**
   * Build markup for an item. It contains the markup for the component and the action buttons
   *
   * @param index
   * @param value
   * @private
   */
  _buildElementMarkup(index, value) {
    const renderAddButton = !(this.readonly || this.disabled || (this.maxItems && this.value.length >= this.maxItems));
    const renderRemoveButton = (!(this.readonly || this.disabled) && this.value.length > 1);
    const value4RemoveAria = (this.displayValue && this.displayValue[index]) ? this.displayValue[index] : value;
    return html`<div class="ot-multi-value__item" role="listitem">${this.#getTemplateMarkup()} ${renderAddButton ? html`<button class="ot-multi-value__add-button ot-btn ot-icon ot-icon--is-action-small-icon ot-icon--is-styleable-icon ot-icon--appearance-blue" @click="${() => this._addNewElement(index)}" aria-label="${this.addLabel}" title="${this.addLabel}">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION_SMALL}:action_small_add14`)}</button>` : html``} ${renderRemoveButton ? html`<button class="ot-multi-value__remove-button ot-btn ot-icon ot-icon--is-action-small-icon ot-icon--is-styleable-icon ot-icon--appearance-red" @click="${() => this._removeElement(index)}" aria-label="${sformat(this.removeAriaLabel, value4RemoveAria)}" title="${this.removeLabel}">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION_SMALL}:action_small_delete14`)}</button>` : html``}</div>`;
  }

  /**
   * Remove event listener on click. Also clean up all event listeners from child components.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeAllEventListenersForChildElements();
  }

  /**
   * Add event listener to each input component after the template is rendered.
   *
   * @param changedProperties
   */
  async updated(changedProperties) {
    super.updated(changedProperties);
    const childElements = this._getAllChildElements();

    await Promise.all(Array.from(childElements).map(c => c.updateComplete));

    let index = 0;
    const displayValue = [];

    for (const element of childElements) {
      if (this.#firstUpdated && this.value.length === 1 && this.value[0] === '') {
        this.#updateValue(index, element);
      }

      this._updateElement(index, element);

      displayValue.push(element.displayValue);

      if (this.item2Focus === index) {
        this.item2Focus = -1;
        element.focus();
      }
      index += 1;
    }

    this.setInternalsFormValue(this.value.toString());

    this.#displayValue = displayValue;
    this.#firstUpdated = false;
  }

  getDisplayValue() {
    return this.#displayValue;
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    // Make sure that the default values has the same amount as defined by the maxItems.
    if (this.maxItems.length && parseInt(this.maxItems, 10) !== this.value.length) {
      this.value = this.value.splice(0, parseInt(this.maxItems, 10));
    }

    this.initInternalsForm(this.value.toString());
  }

  /**
   * Render the template.
   */
  render() {
    return html`<div class="ot-multi-value ot-form-control">${this.renderLabel()}<div id="${this.id}" aria-labelledby="${this.getAriaLabelledByRenderValue()}" aria-describedby="${this.getAriaDescribedByRenderValue()}" role="list">${this.value.map((value, index) => this._buildElementMarkup(index, value))}</div>${this.renderInfoMessage()}</div>`;
  }

  /**
   * Returns the first child element. It's used in `otc-inline-edit-container` to set focus on the first element.
   * @internal
   */
  get firstChildElement() {
    const allChildElements = this._getAllChildElements();
    return (allChildElements && allChildElements[0]) ? allChildElements[0] : null;
  }

  /**
   * Validation API
   * @internal
   */
  get validity() {
    let validityObject;
    for (const element of this._getAllChildElements()) {
      validityObject = element.validity;
      if (!element.validity?.valid) {
        break;
      }
    }

    return validityObject;
  }

  /**
   * Validation API
   *
   * @returns {boolean}
   */
  checkValidity() {
    let isValid = true;
    for (const element of this._getAllChildElements()) {
      element.checkValidity();

      if (!element.validity?.valid) {
        isValid = false;
        break;
      }
    }

    return isValid;
  }

  /**
   * Validation API
   */
  reportValidity() {
    for (const element of this._getAllChildElements()) {
      element.reportValidity();
    }
  }
}

if (!customElements.get('otc-multivalue')) {
  customElements.define('otc-multivalue', OtcMultiValue);
}

export { OtcMultiValue };
//# sourceMappingURL=otcMultiValue.js.map
