/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import { RTLController } from '../../controllers/rtlController.js';
import { ThemeController } from '../../controllers/themeController.js';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import otcToggleStyles from './otcToggle.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Toggle component sets a single value to a state of on or off.
 * Each toggle is independent; it does not interact with other controls or settings.
 * @prop {boolean} altLabelPosition Swap the label to the other side of the toggle.
 * @prop {boolean} checked The checked state of the toggle.
 * @fires change Fired when the state of the toggle has changed.
 */
class OtcToggle extends FormElement {
  #rtlController = new RTLController(this);

  #themeController = new ThemeController(this);

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      otcToggleStyles,
    ];
  }

  static get properties() {
    const props = {
      altLabelPosition: { type: Boolean, reflect: true },
      checked: { type: Boolean, reflect: true },
    };

    return { ...FormElement._commonProperties, ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.altLabelPosition = false;
    this.checked = false;
  }

  firstUpdated() {
    this.initInternalsForm(this.checked ? 'checked' : '');
  }

  #handleChange(event) {
    this.checked = event.target.checked;
    this.setInternalsFormValue(this.checked ? 'checked' : '');
    this.triggerChangeEvent();
  }

  #handleInputKeydown(event) {
    switch (event.key) {
      // The native checkbox takes care of 'Spacebar'.  We only need to handle 'Enter'.
      case 'Enter':
        this.click();
        break;

      // no default
    }
  }

  #getLabelTextTemplate() {
    return html`<div class="ot-toggle__label-text">${this.renderRequiredIndicator()} ${this.label}</div>`;
  }

  #getToggleControlTemplate() {
    const toggleControlHandleClasses = {
      'ot-toggle__control-handle': true,
      'ot-toggle__control-handle--is-rtl': this.#rtlController.isRTL,
    };

    return html`<input .checked="${this.checked}" ?disabled="${this.disabled}" ?required="${this.required}" type="checkbox" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" @change="${this.#handleChange}" @keydown="${this.#handleInputKeydown}"><div class="ot-toggle__control"><span class="ot-toggle__control-track"><span class="${e(toggleControlHandleClasses)}"></span></span></div>`;
  }

  #getJatoTemplate() {
    return html`<div class="ot-toggle__control-wrapper">${this.altLabelPosition ? this.#getLabelTextTemplate() : nothing} ${this.#getToggleControlTemplate()} ${!this.altLabelPosition ? this.#getLabelTextTemplate() : nothing}</div>`;
  }

  #getCFTemplate() {
    const typeClasses = {
      'ot-toggle__control-wrapper': true,
      'ot-toggle__control-wrapper--is-dark': this.dark,
    };

    return html`${this.#getLabelTextTemplate()}<div class="${e(typeClasses)}">${this.#getToggleControlTemplate()}</div>`;
  }

  render() {
    const toggleClasses = {
      'ot-form-control__label': true,
      'ot-toggle': true,
      'ot-toggle--is-disabled': this.disabled,
    };

    return html`<div class="${e(this.getCommonFormClasses(!this._themeIsCarbonFiber))}" ?disabled="${this.disabled}"><label class="${e(toggleClasses)}">${this._themeIsCarbonFiber ? this.#getCFTemplate() : this.#getJatoTemplate()}</label> ${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-toggle')) {
  customElements.define('otc-toggle', OtcToggle);
}

export { OtcToggle };
//# sourceMappingURL=otcToggle.js.map
