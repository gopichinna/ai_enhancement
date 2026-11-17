import { FormBase } from './form-base.js';
import { Interactive } from './interactive.js';

/**
 * Provide the basic validation APIs for a custom element.
 * https://www.w3schools.com/js/js_validation_api.asp
 * @fires invalid Fired when the component has been checked for validity and fails to satisfy its constraints.
 */
class FormElement extends Interactive(FormBase) {
  static get _commonProperties() {
    return FormBase._baseProperties;
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
        && (changedProperties.has('checked')
            || changedProperties.has('value')
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
   * Returns the element's current validity state.
   *
   * @returns null | ValidityState object
   * @internal
   */
  get validity() {
    const nativeElement = this.innerInteractiveElement;

    if (!nativeElement) {
      return null;
    }

    return nativeElement.validity;
  }

  /**
   * ValidationAPI.
   *
   * Returns whether the element is a candidate for constraint validation.
   * @returns null | Boolean
   * @internal
   */
  get willValidate() {
    const nativeElement = this.innerInteractiveElement;

    if (!nativeElement) {
      return null;
    }

    return nativeElement.willValidate;
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
    const nativeElement = this.innerInteractiveElement;

    if (!nativeElement) {
      return null;
    }

    return nativeElement.validationMessage;
  }

  /**
   * ValidationAPI.
   *
   * Returns a Boolean that is false if the element is a candidate for constraint validation,
   * and it does not satisfy its constraints.
   * In this case, it also fires an invalid event at the element.
   *
   * @returns null | Boolean
   */
  checkValidity(showErrorMessage = true) {
    const nativeElement = this.innerInteractiveElement;

    if (!nativeElement) {
      return null;
    }

    const isValid = nativeElement.checkValidity();

    if (!isValid) {
      this.dispatchEvent(new CustomEvent('invalid', { bubbles: false, cancelable: true }));
    }

    this.forceUpdate(showErrorMessage);

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
    const nativeElement = this.innerInteractiveElement;

    if (nativeElement) {
      nativeElement.setCustomValidity(message);
    }

    // Force an update in order to display the new error message.
    this.requestUpdate();
    this.performUpdate();

    // Force a validity check.
    this.checkValidity();
  }

  /**
   * ValidationAPI.
   *
   * Runs the reportValidity() method,
   * and if it returns false (for an invalid input or no pattern attribute provided),
   * then it reports to the user that the input is invalid in the same manner
   * as if you submitted a form.
   */
  reportValidity() {
    const nativeElement = this.innerInteractiveElement;

    if (!nativeElement) {
      return null;
    }

    const isValid = nativeElement.reportValidity();

    if (!isValid) {
      this.dispatchEvent(new CustomEvent('invalid', { bubbles: false, cancelable: true }));
    }

    this.forceUpdate();

    return isValid;
  }

  /**
   * Get the interactive element (the native input or textarea).
   * This method is used also by the interactive interface.
   *
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this.shadowRoot ? this.shadowRoot.querySelector('input, textarea') : null;
  }

  /**
   * Add invalid event handling for the element.
   * This handling is used only to prevent the HTML5 validation pop-up message of the browser (SVF-4587)
   */
  handleInvalidEvent() {
    const element = this.innerInteractiveElement;

    if (element) {
      element.addEventListener('invalid', (event) => {
        event.preventDefault();
      });
    }
  }
}

export { FormElement };
//# sourceMappingURL=form-element.js.map
