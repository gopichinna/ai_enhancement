/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { FormElement } from '../form-element.js';
import { OtcCheckboxBase } from './otcCheckboxBase.js';
import commonStyleSheet from '../../styles/common.scss.js';
import checkboxStyleSheet from './otcCheckbox.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/* eslint-disable max-classes-per-file */

/**
 * The Checkbox component is similar to a standard checkbox element with a state of checked, unchecked, or indeterminate.
 * It also supports readonly and disabled states. The readonly state might not be read by some screenreaders.
 * Each checkbox is independent and does not interact with other controls or settings.
 * @prop {boolean} altStyle  Render with a style similar to readonly.
 * @prop {boolean} checked The checked state of the checkbox.
 * @prop {boolean} indeterminate The indeterminate state of the checkbox.
 * @prop {boolean} hideRequiredIndicator Hide the asterisk symbol in the label for required checkbox.
 * @prop {string} name Name of the checkbox.
 * @slot unnamed Defines the label of the checkbox.
 * @fires change Fired when the state of the checkbox has changed.
 * @fires input Fired when the state of the checkbox has changed.
 */
class OtcCheckbox extends OtcCheckboxBase(FormElement) {
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
      hideRequiredIndicator: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
      _isUsedInGroup: { state: true },
    };

    return { ...FormElement._commonProperties, ...OtcCheckboxBase.properties, ...props };
  }

  constructor() {
    super();

    this.altStyle = false;
    this.checked = false;
    this.indeterminate = false;
    this.hideRequiredIndicator = false;
    this.name = '';
    this._isUsedInGroup = false;
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    // Set the state if the checkbox is used inside a checkbox-group or not.
    this._isUsedInGroup = this.parentElement.tagName === 'OTC-CHECKBOXGROUP';

    // Add the checkbox to the form association if it's not used inside a checkbox-group,
    if (!this._isUsedInGroup) {
      this.initInternalsForm(this.checked ? 'checked' : '');
    }

    this.handleInvalidEvent();
  }

  click() {
    super.click();

    // Update the value for the form if the checkbox is not used inside a checkbox-group.
    if (!this._isUsedInGroup) {
      this.setInternalsFormValue(this.checked ? 'checked' : '');
    }
  }

  render() {
    const inputTemplate = this.getInputTemplate({
      checked: this.checked,
      disabled: this.disabled,
      id: this.id,
      readonly: this.readonly,
      type: 'checkbox',
      required: this.required,
      indeterminate: this.indeterminate,
      name: this.name,
      ariaDescribedBy: this.getAriaDescribedByRenderValue(),
      ariaErrorMessage: this.getAriaErrorMessage(),
      ariaInvalid: this.getAriaInvalidRenderValue(),
      ariaLabel: this.ariaLabel,
      ariaRequired: this.getAriaRequiredRenderValue(),
    });

    const otCheckboxClasses = {
      'ot-checkbox': true,
      'ot-checkbox--alt-style': this.altStyle,
      'ot-checkbox--normal-style': !this.altStyle,
      'ot-checkbox--read-only': this.readonly && !this.altStyle, // can only be readonly if not altStyle
      'ot-checkbox--disabled': this.disabled,
      'ot-checkbox--interactive-only': this.interactiveOnly,
    };
    return html`<div class="${e(this.getCommonFormClasses())}"><div class="${e(otCheckboxClasses)}"><div class="ot-checkbox__wrapper">${inputTemplate} ${this.getCheckboxWrapperTemplate(this.id)} ${!this.hideRequiredIndicator ? this.renderRequiredIndicator() : ''}</div></div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
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
