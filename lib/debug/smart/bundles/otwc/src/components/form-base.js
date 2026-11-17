import { html } from 'lit';
import { ElementBase } from './element-base.js';
import { generateUniqueNumber, triggerEvent } from '../utilities/common-utilities.js';
import styleSheet from './form-base.scss.js';
import { ifDefined as o } from '../../node_modules/lit-html/directives/if-defined.js';
import { classMap as e } from '../../node_modules/lit-html/directives/class-map.js';

/**
 * @prop {string} ariaLabel The aria-label of the form element.
 * @prop {boolean} dark The dark state of the form element.
 * @prop {boolean} disabled The disabled state of the form element.
 * @prop {string} id A randomly generated id used to identify this form element.
 * @prop {string} infoMessage Defines the information message that will be displayed for the form element.
 * @prop {boolean} interactiveOnly Show only interactive element. Label and message elements are hidden.
 * @prop {string} label Defines the label for the form element.
 * @prop {boolean} liveValidation Enable live validation and display the error message immediately when validation fails.
 * @prop {string} noValueText The text to display when a form element has no value.
 * @prop {boolean} readonly The readonly state of the form element.
 * @prop {boolean} required Indicates that user input is required.
 * @fires change Fired when the state of the form element changes.
 */
class FormBase extends ElementBase {
  #showErrorMessage = false;

  constructor() {
    super();

    // Get the ElementInternals object to make the form element participate in HTML forms
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals
    this.internals = this.attachInternals();

    this.ariaLabel = '';
    this.dark = false;
    this.disabled = false;
    this.infoMessage = '';
    this.interactiveOnly = false;
    this.label = '';
    this.liveValidation = false;
    this.noValueText = 'No Value';
    this.readonly = false;
    this.required = false;

    // Generate random id for message elements.
    const uniqueNumber = generateUniqueNumber();
    this.id = `el-${uniqueNumber}`;
    this._labelId = `el-${uniqueNumber}-Label`;
    this._infoMessageId = `el-${uniqueNumber}-Info`;
    this._errorMessageId = `el-${uniqueNumber}-Error`;
  }

  /**
   * This property has no internal use but it's needed to mark our form elements as form associated.
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals
   *
   * @returns {boolean}
   * @internal
   */
  static get formAssociated() {
    return true;
  }

  /**
   * Set initial value of the component to the form.
   * Listen to the submit event of the form and trigger checkValidity() for the component.
   * This will mark the component as valid or invalid in the form and prevent the form to be sent,
   * when an element is invalid.
   *
   * @param {string} value
   */
  initInternalsForm(value) {
    if (!this.internals.form) {
      return;
    }

    this.setInternalsFormValue(value);

    // Trigger checkValidity() for the component, when the form is submitted.
    this.internals.form.addEventListener('submit', (event) => {
      if (!this.checkValidity()) {
        event.preventDefault();
        this.focus();
      }
    });
  }

  /**
   * Set value to the form via the ElementInternals Object.
   *
   * @param {string} value
   */
  setInternalsFormValue(value) {
    this.internals.setFormValue(value);
  }

  static get _baseProperties() {
    return {
      ariaLabel: { type: String, reflect: true },
      dark: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      id: { type: String, reflect: true },
      infoMessage: { type: String, reflect: true },
      interactiveOnly: { type: Boolean, reflect: true },
      label: { type: String, reflect: true },
      liveValidation: { type: Boolean, reflect: true },
      noValueText: { type: String, reflect: true },
      readonly: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
    };
  }

  /**
   *
   * @returns Object
   */
  getCommonFormClasses(isJato = false) {
    return {
      'ot-form-control': true,
      'ot-form-control--is-invalid': this.handleErrorMessage(),
      'ot-form-control--is-dark': this.dark && !isJato,
      'ot-form--is-interactive-only': this.interactiveOnly,
    };
  }

  static getFormStyles() {
    return styleSheet;
  }

  /**
   *
   * @returns true|undefined
   */
  getAriaRequiredRenderValue() {
    return o(this.required && !this.readonly ? true : undefined);
  }

  /**
   *
   * @returns string|undefined
   */
  getAriaInvalidRenderValue() {
    return o(this.validity && this.validity.valid === false ? 'true' : undefined);
  }

  /**
   * Returns the id of the element with the infoMessage
   * @returns string|undefined
   */
  getAriaDescribedByRenderValue() {
    return o(this.infoMessage ? this._infoMessageId : undefined);
  }

  /**
   * Returns the id of the element with the error message
   * @returns string
   */
  getAriaErrorMessage() {
    return this._errorMessageId;
  }

  /**
   * Returns the id of the label
   * @returns string|undefined
   */
  getAriaLabelledByRenderValue() {
    return o(this.label ? this._labelId : undefined);
  }

  /**
   * Render markup for label element.
   *
   * @param forElement
   * @param isFormGroupLabel
   * @returns {TemplateResult}
   */
  renderLabel(forElement = this.id, isFormGroupLabel = false) {
    const labelClasses = {
      'ot-form-control__label': true,
      'ot-form-control__label--is-form-group': isFormGroupLabel,
    };

    return this.label
      ? html`<label for="${forElement}" id="${this._labelId}" class="${e(labelClasses)}">${this.renderRequiredIndicator()}<div class="ot-form-control__label-text">${this.label}</div></label>`
      : html``;
  }

  /**
   * Render the required indicator.
   */
  renderRequiredIndicator() {
    return this.required && !this.readonly
      ? html`<div aria-hidden="true" class="ot-form-control__required-indicator">*</div>`
      : html``;
  }

  /**
   * Render markup for error message element.
   * The errorMessage should only be set when the field is actually invalid.
   * Otherwise, the live-region will not detect a change and not speak out.
   * @param errorMessage
   */
  renderErrorMessage(errorMessage) {
    return html`<p class="ot-form-control__error-text-container"><span class="ot-form-control__error-text-wrapper"><span class="ot-form-control__error-text" aria-live="polite" id="${this._errorMessageId}">${errorMessage}</span></span></p>`;
  }

  /**
   * Render markup for info message element.
   */
  renderInfoMessage() {
    return this.infoMessage
      ? html`<p class="ot-form-control__info-text" id="${this._infoMessageId}">${this.infoMessage}</p>`
      : html``;
  }

  /**
   * Handling for placeholder text.
   * In case of no value and the element is in readonly mode, the placeholder should be the 'noValueText'
   *
   * @returns {string}
   */
  getPlaceholderText() {
    if (this.readonly && !this.value.length) {
      return this.noValueText;
    }

    return this.placeholder;
  }

  /**
   * Check the validity state of the element.
   * If the state is invalid, then set the error message text.
   * A boolean is returned to identify if the error message can be shown or not.
   *
   * @returns {boolean}
   */
  handleErrorMessage() {
    // Do handling only when liveValidation is true.
    // But if #forceUpdate is true, then always handle the error message, even when the liveValidation is false.
    if (!this.#showErrorMessage && !this.liveValidation) {
      return false;
    }

    // Don't handle errors on disabled fields, because these are not reachable by the user and not sent to a server.
    if (this.disabled) {
      return false;
    }

    // Set the flag back to false, to prevent the error message is shown when liveValidation is false.
    this.#showErrorMessage = false;

    const formControlElement = this.shadowRoot.querySelector('.ot-form-control');
    if (!formControlElement) {
      return false;
    }

    if (this.validity && !this.validity.valid) {
      return true;
    }

    return false;
  }

  /**
   * Force the component to update
   * and if needed, show an error message when the element is invalid.
   *
   * Set the #showErrorMessage property to true to show the error message even when the liveValidation attribute is set to false.
   * This flag is used in the handleErrorMessage() method to always show the error message if the element is invalid.
   *
   * @returns void
   */
  forceUpdate(showErrorMessage = true) {
    if (showErrorMessage) {
      this.#showErrorMessage = true;
    }

    // Force an update in order to display the new error message if needed.
    this.requestUpdate();
    this.performUpdate();
  }

  /**
   * Triggers a 'change' event by calling dispatchEvent.  The event bubbles and has optional details.
   * @param {object} detail The object passed in the event `detail`.
   * @internal
   */
  triggerChangeEvent(detail = null) {
    /** @internal */
    triggerEvent(this, CustomEvent, 'change', detail);
  }
}

export { FormBase };
//# sourceMappingURL=form-base.js.map
