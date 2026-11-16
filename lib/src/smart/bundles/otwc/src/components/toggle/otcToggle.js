/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcToggle.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Toggle component sets a single value to a state of on or off.
 * Each toggle is independent; it does not interact with other controls or settings.
 * @prop {boolean} checked The checked state of the toggle.
 * @fires change Fired when the state of the toggle has changed.
 */
class OtcToggle extends FormElement {
  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      checked: {
        type: Boolean,
        reflect: true,
      },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  constructor() {
    super();

    this.checked = false;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);
    this.initInternalsForm(this.checked ? 'checked' : undefined);
  }

  // triggered by the internal input element, but only when changing by click or keyboard
  _onChange(e) {
    this.checked = e.target.checked;
    this.triggerChangeEvent();
  }

  render() {
    const typeClasses = {
      'ot-toggle__control-wrapper--is-dark': this.dark,
    };
    return html`<div class="${e(this.getCommonFormClasses())}" ?disabled="${this.disabled}"><label class="ot-toggle ot-form-control__label"><div class="ot-toggle__label-text">${this.renderRequiredIndicator()} ${this.label}</div><div class="ot-toggle__control-wrapper ${e(typeClasses)}"><input type="checkbox" ?required="${this.required}" ?disabled="${this.disabled}" @change="${this._onChange}" .checked="${this.checked}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}"><div class="ot-toggle__control"><span></span></div></div></label> ${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-toggle')) {
  customElements.define('otc-toggle', OtcToggle);
}

export { OtcToggle };
//# sourceMappingURL=otcToggle.js.map
