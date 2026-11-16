import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import commonStyleSheet from '../../styles/common.scss.js';
import checkboxStyleSheet from './otcCheckbox.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/* eslint-disable max-classes-per-file */
/**
 * The Checkbox component is similar to a standard checkbox element with a state of checked, unchecked, or indeterminate.
 * It also supports readonly and disabled states but these just differ in styling.
 * Each checkbox is independent and does not interact with other controls or settings.
 * @prop {boolean} altStyle  Render with a style similar to readonly.
 * @prop {boolean} checked The checked state of the checkbox.
 * @prop {boolean} indeterminate The indeterminate state of the checkbox.
 * @prop {string} name Name of the checkbox.
 * @slot unnamed Defines the label of the checkbox.
 * @fires change Fired when the state of the checkbox has changed.
 */
class OtcCheckbox extends FormElement {
  constructor() {
    super();

    this.altStyle = false;
    this.checked = false;
    this.indeterminate = false;
    this.name = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormElement.getFormStyles(),
      checkboxStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      altStyle: { type: Boolean, reflect: true },
      checked: { type: Boolean, reflect: true },
      indeterminate: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.#handleKeyDown);
    this.removeEventListener('click', this.#handleClick);
  }

  #handleClick(event) {
    if (!this.readonly && !this.disabled) {
      // Update the value of the checkbox.
      this.checked = !this.checked;
      this.indeterminate = false;

      // Prevent the default behavior to avoid the `input` in the shadow root from further modifying the checkbox.
      event.preventDefault();

      // Dispatch a change event now that the value has been updated.
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
  }

  click() {
    // click() was overridden in the Interactive mixin to redirect the click to the interactive element in the shadow root.  For this
    // component, we are processing the click at the web component level, so we don't want this redirection to the interactive element in
    // the shadow root.  So, we will override click() again to bypass the implementation in the Interactive mixin and instead we will call
    // the original implementation of click().
    HTMLElement.prototype.click.apply(this);
  }

  #handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        // Handle Enter or Spacebar as if we clicked the item.
        this.#handleClick(event);
        event.preventDefault();
        break;
    }
  }

  render() {
    const inputClasses = {
      'ot-checkbox__input-altstyle': this.readonly || this.altStyle,
    };

    return html`<div class="${e(this.getCommonFormClasses())}"><label class="ot-checkbox"><input ?checked="${this.checked}" class="${e(inputClasses)}" ?disabled="${this.disabled || this.readonly}" id="${this.id}" .indeterminate="${this.indeterminate}" name="${this.name}" ?required="${this.required}" type="checkbox" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" aria-required="${this.getAriaRequiredRenderValue()}"><div class="ot-checkbox__wrapper"><span class="ot-checkbox__icon"></span> <span class="ot-checkbox__text"><slot></slot></span>${this.renderRequiredIndicator()}</div></label> ${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-checkbox')) {
  customElements.define('otc-checkbox', OtcCheckbox);
}

if (!customElements.get('otc-tristatecheckbox')) {
  customElements.define('otc-tristatecheckbox', class OtcTristateCheckbox extends OtcCheckbox {});
}

export { OtcCheckbox };
//# sourceMappingURL=otcCheckbox.js.map
