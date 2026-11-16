/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcRadio.scss.js';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { RadioGroupController } from './RadioGroupController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * @prop {boolean} checked The checked state of the radio.
 * @prop {boolean} isFocusable Determines if this radio component can be focused.
 * @prop {string} name The name of the radio group that this radio component belongs to.
 * @prop {string} value The value of the radio.
 */
class OtcRadio extends FormElement {
  constructor() {
    super();

    this.checked = false;
    this.isFocusable = false;
    this.name = undefined;
    this.value = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      checked: { type: Boolean, reflect: true },
      isFocusable: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
      value: { type: String, reflect: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  render() {
    const classes = { 'ot-radio--readonly': this.readonly };
    // Note: must re-render the input element when checked changes, otherwise the ot-radio__icon
    // does not change the image (css). This might be a browser or otcss bug...
    // readonly is not valid on a type=radio, so we need to workaround by using disabled on all of the non-checked in a group
    return html`<label class="ot-radio"><input class="${e(classes)}" type="radio" .name="${this.name}" .value="${this.value}" ?checked="${this.checked}" aria-checked="${this.checked}" ?disabled="${this.disabled || (this.readonly && !this.checked)}" tabindex="${(this.isFocusable || this.checked) && !this.disabled ? 0 : -1}" @change="${this._onChange}" aria-required="${this.getAriaRequiredRenderValue()}" aria-invalid="${this.getAriaInvalidRenderValue()}"> <span class="ot-radio__wrapper"><span class="ot-radio__icon"></span> <span class="ot-radio__text"><slot></slot></span></span></label>`;
  }

  _onChange() {
    this.checked = true;
  }

  async selectAndFocus() {
    this.checked = true;
    // wait for updating dom is complete, because if setting first the focus and then updating
    // or even re-rendering the element could cause the browser to not focus it finally
    await this.updateComplete;
    const inputElement = this.shadowRoot.querySelector('input');
    inputElement.focus();
  }

  // This function gets called when the component is fully rendered and shadow root is
  // available.
  // If the checked property changed from false to true, call _onChange which uses the
  // RadioGroupController to let it clear the checked property on all other radio buttons in the
  // group and then trigger a change event.
  updated(changedProperties) {
    super.updated?.(changedProperties);

    if (changedProperties.has('checked')) {
      const oldValue = changedProperties.get('checked');
      const newValue = this.checked;

      // It is also necessary to explicitly set the checked property of the inner input
      // element. Otherwise the property does not get updated, even if the attribute is set
      // and the wrong image for the checked/unchecked state is displayed (because css selectors
      // rely on properties not on attributes)
      const inputElement = this.shadowRoot.querySelector('input');
      inputElement.checked = newValue;

      if (!oldValue && newValue) {
        const radioGroupController = RadioGroupController.getController(this);
        radioGroupController.updateForChecked(this);

        this.dispatchEvent(new CustomEvent('change', {
          detail: {
            value: this.value,
          },
          bubbles: false,
        }));
      }
      // when unchecking this radio and no other radio of the radio group is checked, then the
      // group value is undefined
      if (oldValue && !newValue) {
        const radioGroupController = RadioGroupController.getController(this);
        if (!radioGroupController.isAtLeastOneSelected(this)) {
          this.dispatchEvent(new CustomEvent('change', {
            detail: {
              value: undefined,
            },
            bubbles: false,
          }));
        }
      }
    }
    if (changedProperties.has('name')) {
      const radioGroupController = RadioGroupController.getController(this);
      const oldName = changedProperties.get('name');
      const newName = this.name || this.getAttribute('name') || '';
      if (newName !== oldName) {
        // always unregister from group with old name
        radioGroupController.unregister(this, oldName);
        // always register with new name, which might create a new group in radio group controller
        radioGroupController.register(this);
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._attributeChangedCallback) {
      return;
    }

    this._attributeChangedCallback = true;

    switch (name) {
      case 'disabled':
        if (newValue === '') { // null if disabled not set, "" if disabled is specified
        // if focus was at this element, unfocus it by calling blur
          this.blur();
        }
        break;
      case 'readonly':
        this.readonly = newValue === '';
        break;
    }

    super.attributeChangedCallback(name, oldValue, newValue);
    this._attributeChangedCallback = false;
  }
}

if (!customElements.get('otc-radio')) {
  customElements.define('otc-radio', OtcRadio);
}

export { OtcRadio };
//# sourceMappingURL=otcRadio.js.map
