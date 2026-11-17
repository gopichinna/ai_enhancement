import { html } from 'lit';
import { actionEdit, actionCloseSmall, actionCheckmark } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import componentStyleSheet from './otcInlineEditContainer.scss.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import { ThemeController } from '../../controllers/themeController.js';
import { validateDecimal, validateInteger } from '../../utilities/validation.utilities.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Inline Edit Container component is a common container element that provides the possibility to toggle the containing form fields
 * between a read-only and a read-write state.
 * @prop {string} cancelLabel Alternative label text for cancel button.
 * @prop {boolean} edit Allows to set the component only in edit mode.
 * The component will then always stay in edit mode until the attribute is removed.
 * Interactions with the component like save or cancel the data input, will not set the component to read mode.
 * **Note: ** Only works when the component is not disabled.
 * @prop {string} editLabel Alternative label text for edit button.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the input has no value.
 * @prop {string} saveLabel Alternative label text for save button.
 * @prop {string} title Title text/tooltip for the button text element on readonly mode.
 * @prop {string} value The value of the input.
 * @prop {boolean} disabled Show the container as disabled.
 * @prop {boolean} readonly Show the container in readonly only.
 * @prop {boolean} showActionButtonsUnderInput Position the action buttons under the input field.
 * @slot unnamed Defines the inline edit container's content.
 * **Note: ** Although this slot accepts HTML Elements, it is strongly recommended
 * that you only use OT Web Component from **Form elements** to preserve the intended design.
 * @fires saved Fired when in edit state the save icon-button is activated either with a mouse/tap or by using the **Enter** key.
 * The values of the element inside the container will be served as data as String in the event.`,
 * @fires cancelled Fired when in edit state the cancel icon-button is activated either with a mouse/tap or by using the **Escape** key.
 * An empty data object will be served in the event.
 */
class OtcInlineEditContainer extends FormElement {
  #childDisplayValue = '';

  #isChildMultiValue = false;

  #readOnlyButtonText = '';

  #outsideClickHandler = this._handleOutSideClick.bind(this);

  #tmpChildDisplayValue = '';

  #tmpChildValue = '';

  #themeController = new ThemeController(this);

  #validator = null;

  static get formAssociated() {
    return false;
  }

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
      FormBase.getFormStyles(),
      componentStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      cancelLabel: { type: String, reflect: true },
      edit: { type: Boolean, reflect: true },
      editLabel: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      saveLabel: { type: String, reflect: true },
      title: { type: String, reflect: true },
      value: { type: String, reflect: true },
      validation: { type: String, reflect: true },
      showActionButtonsUnderInput: { type: Boolean, reflect: true },
      _isEditMode: { state: true },
    };

    return { ...FormElement._commonProperties, ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.cancelLabel = 'Cancel';
    this.edit = false;
    this.editLabel = 'Edit';
    this.placeholder = '';
    this.saveLabel = 'Save';
    this.title = '';
    this.value = '';
    this.validation = '';
    this.showActionButtonsUnderInput = false;

    this._isEditMode = false;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.#outsideClickHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#outsideClickHandler);
  }

  /**
   * Handle click event. When click is outside the component, then execute the save data process.
   *
   * @private
   */
  _handleOutSideClick(event) {
    if (this.edit) {
      return;
    }

    if (typeof event.composedPath === 'function') {
      let outsideClick = true;
      event.composedPath().forEach((element) => {
        if (element.classList
            && (element.classList.contains('ot-inline-edit-container__edit-btn')
              || element.classList.contains('ot-inline-edit-container__save-btn')
              || element.classList.contains('ot-inline-edit-container__cancel-btn')
              || element.classList.contains('ot-input')
              || element.classList.contains('ot-dropdown')
              || element.classList.contains('ot-textarea')
              || element.classList.contains('ot-multi-value')
              || element.classList.contains('ot-inline-edit-container__readonly-value-button')
              || element.classList.contains('ot-input-date__toggle-picker-button')
              || element.classList.contains('ot-datepicker')
              || element.classList.contains('ot-select--combobox-button'))
        ) {
          outsideClick = false;
        }
      });

      if (outsideClick) {
        this._handleSaveData();
      }
    }
  }

  /**
   * API method. Do not rename or delete!
   *
   * Get the child component from slot.
   *
   * @private
   */
  getChildComponent() {
    return this.querySelector('otc-input, otc-textarea, otc-select, otc-input-date, otc-multivalue');
  }

  /**
   * Switching readonly/edit mode
   *
   * @param isEditMode
   * @private
   */
  _switchMode(isEditMode) {
    if (this.disabled || this.readonly) {
      return;
    }

    if (this.edit) {
      this._setFocusOnChildComponent();
      return;
    }

    this._isEditMode = isEditMode;

    if (isEditMode) {
      // Reset all child elements to their initial value.
      const childComponent = this.getChildComponent();
      childComponent.value = this.#isChildMultiValue ? this.value.split(',') : this.value;
      childComponent.displayValue = this.#childDisplayValue;
      this._setFocusOnChildComponent();
    } else {
      this._setFocusOnReadonlyValueButton();
    }
  }

  /**
   * Find the element in the first child and set focus on it.
   *
   * @private
   */
  _setFocusOnChildComponent() {
    const childComponent = this.getChildComponent();
    childComponent.updateComplete.then(() => {
      let focusElement;
      // The multi value can contain multiple components such as otc-input, otc-textarea and otc-select.
      // So we have to get the first element from its API to set focus on.
      if (this.#isChildMultiValue) {
        const { firstChildElement } = childComponent;
        focusElement = firstChildElement.shadowRoot.querySelector('otc-input, input, textarea');
      } else {
        focusElement = childComponent.shadowRoot.querySelector('otc-input, input, textarea');
      }

      if (focusElement) {
        focusElement.focus();
        if (!this.edit) {
          focusElement.select();
        }
      }
    });
  }

  /**
   * Set focus on the readonly value button text.
   * @private
   */
  _setFocusOnReadonlyValueButton() {
    this.shadowRoot.querySelector('.ot-inline-edit-container__readonly-value-button').focus();
  }

  /**
   * Set focus on the cancel button.
   *
   * @private
   */
  _setFocusOnCancelButton() {
    this.shadowRoot.querySelector('.ot-inline-edit-container__cancel-btn').focus();
  }

  /**
   * Handling for keyboard usage.
   *
   * @param event
   * @private
   */
  _handleKeyboard(event) {
    switch (event.key) {
      case 'Escape':
        this._handleCancelEdit();
        break;
      case 'Tab':
        if (!event.shiftKey) {
          this.#handleKeyboardNavigation(event);
        } else if (event.shiftKey) {
          this.#handleKeyboardNavigationBack(event);
        }
        break;
      case 'Enter': // Press enter on edit mode: save data. Press enter on read mode: open edit mode.
        if (event.target.tagName === 'OTC-INPUT' || event.target.tagName === 'OTC-TEXTAREA') {
          event.preventDefault();
          const isEditMode = event.target.readonly === false;
          if (isEditMode) {
            this._handleSaveData();
          } else {
            this._switchMode(true);
          }
        }
        break;
    }
  }

  /**
   * Handle keyboard navigation with Tab
   *
   * @param event
   */
  #handleKeyboardNavigation(event) {
    // Put focus back to the first element when the focus is on the cancel button.
    if (this.shadowRoot.activeElement && this.shadowRoot.activeElement.classList.contains('ot-inline-edit-container__cancel-btn')) {
      event.preventDefault();
      this._setFocusOnChildComponent();
    }
  }

  /**
   * Handle keyboard navigation with Shift-Tab
   *
   * @param event
   */
  #handleKeyboardNavigationBack(event) {
    const { activeElement } = document;

    // When focus is on the action button inside the input or input-date component,
    // then do nothing, and let it navigate to the input or input-date.
    if ((activeElement.tagName === 'OTC-INPUT' || activeElement.tagName === 'OTC-INPUT-DATE')
      && (activeElement.shadowRoot.activeElement.tagName === 'OTC-BUTTON')) {
      return;
    }

    // When focus is not on the first element of a multi-value component,
    // then do nothing, and let it navigate to the other element.
    if (activeElement.tagName === 'OTC-MULTIVALUE') {
      const childElements = activeElement.shadowRoot.querySelectorAll('otc-input, otc-textarea, otc-select, otc-input-date');
      const firstChildElement = (childElements && childElements[0]) ? childElements[0] : null;
      const focusElement = activeElement.shadowRoot.activeElement;

      if (firstChildElement && (firstChildElement?.id !== focusElement?.id)) {
        return;
      }
    }

    // Put focus on the cancel button.
    if (activeElement.tagName === 'OTC-INPUT'
      || activeElement.tagName === 'OTC-TEXTAREA'
      || activeElement.tagName === 'OTC-SELECT'
      || activeElement.tagName === 'OTC-INPUT-DATE'
      || activeElement.tagName === 'OTC-MULTIVALUE') {
      event.preventDefault();
      this._setFocusOnCancelButton();
    }
  }

  /**
   * Execute the validator for the element.
   *
   * @param element
   */
  #validateElement(element) {
    switch (this.#validator.type) {
      case 'integer':
        element.setCustomValidity(validateInteger(element.value, this.#validator));
        break;
      case 'decimal':
        element.setCustomValidity(validateDecimal(element.value, this.#validator));
        break;
    }
  }

  /**
   * Find child element(s) and execute validator on it.
   */
  #validate() {
    const childComponent = this.getChildComponent();

    if (this.#isChildMultiValue) {
      for (const element of childComponent.getAllChildElements()) {
        this.#validateElement(element);
      }
    } else {
      this.#validateElement(childComponent);
    }
  }

  /**
   * Find child element(s) and clear the validation state on it.
   */
  #resetValidationState() {
    const childComponent = this.getChildComponent();

    if (this.#isChildMultiValue) {
      for (const element of childComponent.getAllChildElements()) {
        element.setCustomValidity('');
      }
    } else {
      childComponent.setCustomValidity('');
    }
  }

  /**
   * Handle action when the user clicks the save icon.
   *
   * @private
   */
  _handleSaveData() {
    if (this.disabled || !this._isEditMode) {
      return;
    }

    if (this.#validator) {
      this.#validate();
    }

    if (!this._isChildComponentValid()) {
      return;
    }

    // Set temporary data as real data.
    this.#childDisplayValue = this.#tmpChildDisplayValue;
    this.value = this.#isChildMultiValue ? this.#tmpChildValue.toString() : this.#tmpChildValue;

    this.#generateReadonlyButtonText();

    // Switch to readonly mode.
    this._switchMode(false);

    // Disable the save button. It will be enabled when user types new value in child elements.
    this.#disableSaveButton();

    // Dispatch an event for save with data.
    this.dispatchEvent(
      new CustomEvent('saved', {
        detail: {
          value: this.value,
        },
        bubbles: true,
      }),
    );
  }

  /**
   * Collecting data from the child element.
   */
  #collectChildValues() {
    const childComponent = this.getChildComponent();

    if (!this._isEditMode) {
      this.#childDisplayValue = childComponent.displayValue;
      this.value = this.#isChildMultiValue ? childComponent.value.toString() : childComponent.value;
    }

    this.#tmpChildDisplayValue = childComponent.displayValue;
    this.#tmpChildValue = this.#isChildMultiValue ? childComponent.value.toString() : childComponent.value;
  }

  /**
   * Handle action when the user clicks the cancel edit icon.
   *
   * @private
   */
  _handleCancelEdit() {
    if (this.disabled || !this._isEditMode) {
      return;
    }

    if (!this.edit) {
      this.#resetChildValues();
      this.#generateReadonlyButtonText();
    }

    if (this.#validator) {
      this.#resetValidationState();
    }

    // Dispatch an event for cancel action.
    this.dispatchEvent(
      new CustomEvent('cancelled', {
        detail: {
          value: {},
        },
        bubbles: true,
      }),
    );

    // Switch back to readonly mode.
    this._switchMode(false);

    // Disable the save button for not edit mode. The button will be enabled again when a user types a new value in the child element.
    if (!this.edit) {
      this.#disableSaveButton();
    }
  }

  #resetChildValues() {
    // Reset all child elements to their initial value.
    const childComponent = this.getChildComponent();
    childComponent.value = this.#isChildMultiValue ? this.value.split(',') : this.value;
    childComponent.displayValue = this.#childDisplayValue;

    this.#tmpChildValue = this.value;
    this.#tmpChildDisplayValue = this.#childDisplayValue;
  }

  /**
   * Check validity status of the child component.
   *
   * @returns {boolean}
   * @private
   */
  _isChildComponentValid() {
    const childComponent = this.getChildComponent();

    // Trigger the validation check process in the child element.
    childComponent.reportValidity();

    return childComponent.checkValidity();
  }

  /**
   * Handling when value of the child element is changed.
   *
   * @param element
   * @private
   */
  _handleValueChanged(element, updateValue = true) {
    if (this.disabled || this.readonly) {
      return;
    }

    const newValue = (this.#isChildMultiValue ? element.value.toString() : element.value);

    // Enable save button when the element is valid and the value is changed.
    this.shadowRoot.querySelector('.ot-inline-edit-container__save-btn').disabled = !element.validity.valid || this.value === newValue;

    if (updateValue && element.validity.valid) {
      this.#collectChildValues();
    }
  }

  /**
   * Disable the save button.
   * @private
   */
  #disableSaveButton() {
    this.shadowRoot.querySelector('.ot-inline-edit-container__save-btn').disabled = true;
  }

  /**
   * Get the text to be displayed in read mode.
   *
   * @private
   */
  #generateReadonlyButtonText() {
    const childComponent = this.getChildComponent();

    let displayText;

    if (!childComponent || childComponent.value === undefined) {
      displayText = this.placeholder;
    } else {
      const isMultiValue = childComponent.tagName === 'OTC-MULTIVALUE';

      // If child value comes from the multi value component, which is then an Array.
      // Then display each value in a new line text.
      if (isMultiValue) {
        const valueList = childComponent.value.map((element, index) => {
          const displayValueList = isMultiValue ? childComponent.getDisplayValue() : childComponent.displayValue;
          if (displayValueList[index] && displayValueList[index].length) {
            return displayValueList[index].trim();
          }
          return element.length ? element.trim() : this.placeholder;
        });
        displayText = valueList.join('\n\n');
      } else {
        displayText = (childComponent.displayValue && childComponent.displayValue.length)
          ? childComponent.displayValue
          : childComponent.value;
      }
    }

    this.#readOnlyButtonText = (displayText && displayText.length) ? displayText : this.placeholder;

    // Force an update so that we display the proper values now that the child components are ready.
    this.requestUpdate();
  }

  /**
   * Parse edit button markup with considering of JATO/ CarbonFiber Design.
   *
   * @returns {TemplateResult<1>}
   */
  #getEditButtonMarkup() {
    if (this._themeIsCarbonFiber) {
      return html`<otc-button @click="${() => this._switchMode(true)}" class="ot-inline-edit-container__edit-btn" ariaLabel="${this.editLabel}" title="${this.editLabel}" tabindex="-1" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_edit32"></otc-button>`;
    }

    return html`<otc-button @click="${() => this._switchMode(true)}" class="ot-inline-edit-container__edit-btn" ariaLabel="${this.editLabel}" title="${this.editLabel}" tabindex="-1"><otc-icon svg="${actionEdit}"></otc-icon></otc-button>`;
  }

  /**
   * Parse cancel button markup with considering of JATO/ CarbonFiber Design.
   *
   * @returns {TemplateResult<1>}
   */
  #getCancelButtonMarkup() {
    if (this._themeIsCarbonFiber) {
      return html`<otc-button @click="${() => this._handleCancelEdit()}" class="ot-inline-edit-container__cancel-btn" ariaLabel="${this.cancelLabel}" title="${this.cancelLabel}" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_form_cancel32"></otc-button>`;
    }

    return html`<otc-button @click="${() => this._handleCancelEdit()}" class="ot-inline-edit-container__cancel-btn" ariaLabel="${this.cancelLabel}" title="${this.cancelLabel}"><otc-icon svg="${actionCloseSmall}"></otc-icon></otc-button>`;
  }

  /**
   * Parse save button markup with considering of JATO/ CarbonFiber Design.
   *
   * @returns {TemplateResult<1>}
   */
  #getSaveButtonMarkup() {
    if (this._themeIsCarbonFiber) {
      return html`<otc-button disabled="disabled" @click="${() => this._handleSaveData()}" class="ot-inline-edit-container__save-btn" ariaLabel="${this.saveLabel}" title="${this.saveLabel}" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_form_apply32"></otc-button>`;
    }

    return html`<otc-button disabled="disabled" @click="${() => this._handleSaveData()}" class="ot-inline-edit-container__save-btn" ariaLabel="${this.saveLabel}" title="${this.saveLabel}"><otc-icon svg="${actionCheckmark}"></otc-icon></otc-button>`;
  }

  /**
   * After the DOM has been updated the first time.
   *
   */
  async firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    this._isEditMode = this.edit;

    // Handle for the use of keyboard.
    this.addEventListener('keydown', (event) => {
      this._handleKeyboard(event);
    });

    const childComponent = this.getChildComponent();

    if (!childComponent) {
      return;
    }

    await childComponent.updateComplete;

    this.#isChildMultiValue = childComponent.tagName === 'OTC-MULTIVALUE';

    // Collect initial value from child elements.
    this.#collectChildValues();

    // Listen to the child elements for handling of value change.
    childComponent.addEventListener('input', () => {
      this._handleValueChanged(childComponent, false);
      childComponent.setCustomValidity('');
    });

    childComponent.addEventListener('change', () => {
      this._handleValueChanged(childComponent);
      this.#generateReadonlyButtonText();
    });

    childComponent.addEventListener('valueChanged', () => {
      this._handleValueChanged(childComponent);
      this.#generateReadonlyButtonText();
    });

    this.#generateReadonlyButtonText();
  }

  /**
   * Set/remove attribute for child elements based on the attribute of rw/container.
   *
   * @param changedProperties
   */
  updated(changedProperties) {
    super.updated?.(changedProperties);

    const childComponent = this.getChildComponent();

    if (!childComponent) {
      return;
    }

    this.#validator = this.validation.length ? JSON.parse(this.validation) : null;

    // push attributes down to the single child, so a11y works properly in edit mode
    // if a value was given with the child, that value is retained
    if (this.placeholder && !childComponent.getAttribute('placeholder')) {
      childComponent.setAttribute('placeholder', this.placeholder);
    }
    if (this.label && !childComponent.getAttribute('label')) {
      childComponent.setAttribute('label', this.label);
    }
    if (this.ariaLabel && !childComponent.getAttribute('ariaLabel')) {
      childComponent.setAttribute('ariaLabel', this.ariaLabel);
    }
    if (this.infoMessage && !childComponent.getAttribute('infoMessage')) {
      childComponent.setAttribute('infoMessage', this.infoMessage);
    }

    if (this.dark) {
      childComponent.setAttribute('dark', this.dark);
    } else {
      childComponent.removeAttribute('dark');
    }

    if (this.disabled) {
      childComponent.setAttribute('disabled', '');
    } else {
      childComponent.removeAttribute('disabled');
    }

    if (this.required) {
      childComponent.setAttribute('required', '');
    } else {
      childComponent.removeAttribute('required');
    }
  }

  // We depend on the child component being ready for several reasons, e.g., propagating its value to our own value property or updating the
  // state of the save/cancel buttons when the child component's value changes.  Therefore, we should wait for it to be ready before
  // resolving our own updateComplete promise.
  async getUpdateComplete() {
    await super.getUpdateComplete();

    const childComponent = this.getChildComponent();
    await childComponent.updateComplete;
  }

  /**
   * Combines the label/aria-label with the value/placeholder
   * @returns string|undefined
   */
  _getReadonlyButtonAriaLabel() {
    const value2Use = this.#readOnlyButtonText.replaceAll('\n', ' ');
    const combined = this.ariaLabel && this.ariaLabel.length ? `${this.ariaLabel} ${value2Use}`
      : `${this.label} ${value2Use}`;
    const renderValue = combined.trim();
    return o(renderValue.length ? renderValue : undefined);
  }

  render() {
    const classes = {
      'ot-form-control': true,
      'ot-inline-edit-container': true,
      'ot-inline-edit-container--is-editing': this._isEditMode,
      'ot-inline-edit-container--has-no-label': !this.label.length,
      'ot-inline-edit-container--show-action-buttons-under-input': this.showActionButtonsUnderInput,
      'ot-inline-edit-container--is-jato': !this._themeIsCarbonFiber,
    };

    const displayTextClasses = {
      'ot-inline-edit-container__display-text': true,
      'ot-inline-edit-container__display-text--is-disabled': this.disabled,
      'ot-inline-edit-container__display-text--is-placeholder': !this.disabled && !this.value.length,
      'ot-inline-edit-container__display-text--is-dark': this.dark,
    };

    return html`<div class="${e(classes)}">${this.renderLabel()}<div class="ot-inline-edit-container__wrapper"><slot class="ot-inline-edit-container__child-wrapper"></slot><div class="ot-inline-edit-container__readonly-value-button-wrapper"><button @click="${() => this._switchMode(true)}" class="ot-inline-edit-container__readonly-value-button" aria-label="${this._getReadonlyButtonAriaLabel()}" aria-invalid="${this.getAriaInvalidRenderValue()}" title="${this.title}" ?disabled="${this.disabled}"><div class="${e(displayTextClasses)}">${this.#readOnlyButtonText}</div></button></div>${(!this.disabled && !this.readonly) ? html`<div class="ot-inline-edit-container__btn-wrapper"><div class="ot-inline-edit-container__edit-btn-wrapper">${this.#getEditButtonMarkup()}</div><div class="ot-inline-edit-container__edit-mode-btn-group">${this.#getSaveButtonMarkup()} ${this.#getCancelButtonMarkup()}</div></div>`
    : html``
}</div>${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-inline-edit-container')) {
  customElements.define('otc-inline-edit-container', OtcInlineEditContainer);
}

export { OtcInlineEditContainer };
//# sourceMappingURL=otcInlineEditContainer.js.map
