/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { FormBase } from './form-base.js';

/**
 * @prop {string} errorMessage The default error message.
 * @fires invalid Fired when the group has been checked for validity and fails to satisfy its constraints.
 */
class FormGroup extends FormBase {
  constructor() {
    super();
    this.errorMessage = '';
  }

  static get _groupProperties() {
    const props = {
      errorMessage: { type: String, reflect: true },
    };

    return { ...FormBase._baseProperties, ...props };
  }

  /**
   * Call checkValidity again but only if liveValidation is on
   *
   * @param changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    // if one of the following properties changed, validity check could lead to error message update
    if (this.liveValidation
        && (changedProperties.has('value')
            || changedProperties.has('required')
            || changedProperties.has('liveValidation'))) {
      // now that the input element value is set in DOM, the validity can be checked now
      // any error will be rendered afterwards
      this.checkValidity();
    }
  }

  /**
   * ValidationAPI.
   *
   * Returns the group's current validity state.
   *
   * @returns null | ValidityState object
   * @internal
   */
  get validity() {
    const groupElement = this.shadowRoot.host;
    const validity = { valid: false, valueMissing: true };

    if (groupElement.required === true) {
      const elements = groupElement.querySelectorAll('otc-checkbox,otc-radio,otc-selectitem');

      if (!elements) {
        return null;
      }

      for (const element of elements) {
        if ((element.checked === true) || (element.selected === true)) {
          validity.valid = true;
          validity.valueMissing = false;
          break;
        }
      }
    } else {
      validity.valid = true;
      validity.valueMissing = false;
    }

    return validity;
  }

  /**
   * ValidationAPI.
   *
   * Returns a message that describes the validation constraints
   * that the control does not satisfy (if any).
   *
   * @returns null | string
   * @internal
   */
  get validationMessage() {
    const groupElement = this.shadowRoot.host;
    return groupElement.errorMessage;
  }

  /**
   * ValidationAPI.
   *
   * Returns a Boolean that is false if the group is a candidate for constraint validation,
   * and it does not satisfy its constraints.
   * In this case, it also fires an invalid event at the group.
   *
   * @returns null | Boolean
   */
  checkValidity() {
    let atLeastOneSelected = false;
    const groupElement = this.shadowRoot.host;

    const elements = groupElement.querySelectorAll('otc-checkbox,otc-radio,otc-selectitem');

    for (const element of elements) {
      if ((element.checked === true) || (element.selected === true)) {
        atLeastOneSelected = true;
        break;
      }
    }

    const isValid = atLeastOneSelected;

    if (!isValid) {
      this.dispatchEvent(new CustomEvent('invalid', { bubbles: false, cancelable: true }));
    }

    this.showErrorMessage();
    this.requestUpdate();

    return isValid;
  }

  /**
   * ValidationAPI.
   *
   * Sets a custom validity message for the element.
   *
   * @param {string} message
   */
  setCustomValidity(message) {
    const groupElement = this.shadowRoot.host;
    groupElement.errorMessage = message;
  }
}

export { FormGroup };
//# sourceMappingURL=form-group.js.map
