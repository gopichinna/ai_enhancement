/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { limitPropValConverter } from '../../utilities/common-utilities.js';
import { getSVGForIcon, OTC_ICON_BUNDLE_WC_UTILITY, OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import '../../../lib/otc-icons/icons_otc-utility.js';
import commonStyleSheet from '../../styles/common.scss.js';
import inputStyleSheet from './otcInput.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Input component is similar to a standard input element and allows the user to enter and edit text values in one line.
 * @prop {string} max Used for input type `number`. It's the maximum value to accept for this input. If the value entered into the element
 * exceeds this, the element fails constraint validation. If the value of the max attribute isn't a number, then the element has no maximum
 * value.
 * @prop {number} maxLength Sets the maximum number of characters available in the input field.
 * @prop {string} min Used for input type `number`. It's the minimum value to accept for this input. If the value of the element is less
 * than this, the element fails constraint validation. If a value is specified for min that isn't a valid number, the input has no minimum
 * value.
 * @prop {number} minLength Sets the minimum number of characters available in the input field.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the input has no value.
 * @prop {boolean} secondary Enables/disables forms 2.0 look for the input web component.
 * @prop {string} step Used for input type `number`. It's a number that specifies the granularity that the value must adhere to. Only values
 * which are equal to the basis for stepping are valid. **Note:** The default stepping value for number inputs is 1, allowing only integers
 * to be entered—unless the stepping base is not an integer.
 * @prop {string} type Defines the type of the input. Available options are: `text`, `search`,
 * `number`, `password`, `url`, `email`, and `tel`.
 * @prop {string} actionIcon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {string} actionIconAriaLabel The `aria-label` of the action icon button.
 * @prop {string} actionIconTitle The `title` of the action button.
 * @prop {string} ariaLabelClear The `aria-label` of the clear button.
 * @prop {string} tooltipClear The `tooltip` of the clear button.
 * @prop {string} title The `tooltip` of the otc-input. The default of '' avoids browser interference.
 * @prop {string} value The value of the input.
 * @prop {boolean} whiteBackground Set the input background to white color.
 * @prop {boolean} showArrowsForInputNumber Show the input arrows for input with type number.
 * @fires change Fired when the input operation has finished by pressing Enter or on focusout.
 * @fires input Fired when the value of the input changes at each keystroke and when a suggestion item has been selected.
 * @fires action-icon-clicked Fired when the action icon is clicked.
 */
class OtcInput extends FormElement {
  #inputRef = e();

  #inputIsFocused = false;

  #isTypeSearch = false;

  constructor() {
    super();

    this.max = '';
    this.maxLength = -1;
    this.min = '';
    this.minLength = -1;
    this.placeholder = '';
    this.secondary = false;
    this.step = '';
    this.type = 'text';
    this.title = '';
    this.value = '';
    this.whiteBackground = false;
    this.showArrowsForInputNumber = false;
    this.actionIcon = '';
    this.actionIconAriaLabel = '';
    this.actionIconTitle = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      inputStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      max: { type: String, reflect: true },
      maxLength: { reflect: true, converter: limitPropValConverter },
      min: { type: String, reflect: true },
      minLength: { reflect: true, converter: limitPropValConverter },
      placeholder: { type: String, reflect: true },
      secondary: { type: Boolean, reflect: true },
      step: { type: String, reflect: true },
      type: { type: String, reflect: true },
      title: { type: String, reflect: true },
      value: { type: String, reflect: true },
      whiteBackground: { type: Boolean, reflect: true },
      showArrowsForInputNumber: { type: Boolean, reflect: true },
      actionIcon: { type: String, reflect: true },
      actionIconAriaLabel: { type: String, reflect: true },
      actionIconTitle: { type: String, reflect: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    if (this.validity && this.validity.valid === false && this.disabled) {
      this.disabled = false;
    }

    this.innerInteractiveElement.value = this.getValueText();

    this.initInternalsForm(this.value);
    this.handleInvalidEvent();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Invalid type.  Reset to 'text'.
    if (!['text', 'search', 'password', 'url', 'email', 'tel', 'number'].includes(this.type.toLowerCase())) {
      this.type = 'text';
    }

    this.#isTypeSearch = this.type.toLowerCase() === 'search';

    if (changedProperties.has('value') && changedProperties.get('value') !== undefined) {
      this.dispatchEvent(new CustomEvent('value-changed', { detail: null, bubbles: true }));

      // SVF-4490: Special handling for abnormal behavior of minLength validation for HTML input.
      // When value is set to the native input element via property `.value=""` in render markup,
      // then the validation of the input gets valid state, even though the minLength is not reached.
      if (this.innerInteractiveElement.value !== this.value) {
        this.innerInteractiveElement.value = this.getValueText();
        this.checkValidity();
      }
    }
  }

  select() {
    this.#inputRef.value?.select();
  }

  #renderSearchIcon() {
    return !this.#isTypeSearch || this.#inputIsFocused || this.value.length
      ? html``
      : html`<div class="ot-input-search__search-icon ot-icon--is-action-icon">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_UTILITY}:utility_search12`)}</div>`;
  }

  #renderActionIcon() {
    let icon = '';

    if (this.#isTypeSearch && this.value.length) {
      icon = `${OTC_ICON_BUNDLE_WC_ACTION}:action_close_min32`;
    }

    if (!this.#isTypeSearch && this.actionIcon.length) {
      icon = this.actionIcon;
    }

    return icon.length
      ? html`<otc-button @click="${this.#onActionIconClicked}" class="ot-input__action-icon" arialabel="${this.actionIconAriaLabel}" title="${this.actionIconTitle}" icon="${icon}"></otc-button>`
      : html``;
  }

  render() {
    const inputClass = {
      'ot-input': true,
      'ot-input--is-dark': this.dark,
      'ot-input--is-secondary': this.secondary,
      'ot-input--white-background': this.whiteBackground,
      'ot-input--has-no-value': !this.value && this.readonly,
      'ot-input--hide-number-arrows': this.type === 'number' && !this.showArrowsForInputNumber,
    };

    // MaxLength and MinLength are propagated to attributes, because the built-in
    // property setters throw if a negative value is passed to them. The source
    // for propagation is not an attribute, because the constructor initializes
    // properties and their values are reflected to attributes asynchronously
    // after the first rendering.
    return html`<div class="${e$1({ ...this.getCommonFormClasses(), 'ot-input-search': this.#isTypeSearch })}" role="none">${this.renderLabel()}<div class="ot-form-control__input-group" role="none">${this.#renderSearchIcon()} <input ${n(this.#inputRef)} class="${e$1(inputClass)}" id="${this.id}" maxlength="${this.maxLength >= 0 ? this.maxLength : nothing}" minlength="${this.minLength >= 0 ? this.minLength : nothing}" placeholder="${this.placeholder}" .type="${this.type.toLowerCase()}" min="${(this.type === 'number' && this.min.length) > 0 ? this.min : nothing}" max="${(this.type === 'number' && this.max.length) > 0 ? this.max : nothing}" step="${(this.type === 'number' && this.step.length) > 0 ? this.step : nothing}" ?readonly="${this.readonly}" ?required="${this.required}" ?disabled="${this.disabled}" @input="${this._onInput}" @change="${this._onChange}" @focus="${this._handleInputFocus}" @blur="${this._handleInputBlur}" aria-required="${this.getAriaRequiredRenderValue()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" title="${this.title}"> ${this.#renderActionIcon()}</div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }

  _onInput(e) {
    this.value = e.target.value;
    this.setInternalsFormValue(this.value);
  }

  _onChange() {
    this.triggerChangeEvent();
  }

  #onActionIconClicked() {
    if (this.#isTypeSearch) {
      this.value = '';
      this.updateComplete.then(() => {
        const inputField = this.shadowRoot.querySelector('input.ot-input');
        inputField.focus();
      });
    }

    this.dispatchEvent(new CustomEvent('action-icon-clicked', { detail: null, bubbles: true }));
  }

  _handleInputFocus() {
    if (this.#isTypeSearch) {
      this.#inputIsFocused = true;
      this.requestUpdate(); // rerender, because #inputIsFocused changed
    }
  }

  _handleInputBlur() {
    if (this.#isTypeSearch) {
      this.#inputIsFocused = false;
      this.requestUpdate(); // rerender, because #inputIsFocused changed
    }
  }
}

if (!customElements.get('otc-input')) {
  customElements.define('otc-input', OtcInput);
}

export { OtcInput };
//# sourceMappingURL=otcInput.js.map
