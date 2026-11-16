import { html } from 'lit';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import componentStyleSheet from './otcInlineEditContainer.scss.js';
import { getSVGForIcon, OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import { ifDefined as o } from '../../../node_modules/lit-html/directives/if-defined.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Inline Edit Container component is a common container element that provides the possibility to toggle the containing form fields
 * between a read-only and a read-write state.
 * @prop {string} cancelLabel Alternative label text for cancel button.
 * @prop {boolean} edit Allows to set the component initially in edit mode.  The component will then always stay in edit mode until the
 * attribute is removed.  Interactions with the component like save or cancel the data input, will not set the component to read mode.
 * **Note: ** Only works when the component is not disabled.
 * @prop {string} editLabel Alternative label text for edit button.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the input has no value.
 * @prop {string} saveLabel Alternative label text for save button.
 * @prop {string} title Title text/tooltip for the button text element on readonly mode.
 * @prop {string} value The value of the input.
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
      _isButtonTextFocused: { state: true },
      _isEditMode: { state: true },
    };

    return { ...FormElement._commonProperties, ...props };
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

    this._isButtonTextFocused = false;
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
              || element.classList.contains('ot-datepicker'))
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
   * Get the child component from slot.
   * TODO this selector assumes that there is only ONE
   *
   * @private
   */
  _getChildComponent() {
    return this.querySelector('otc-input, otc-textarea, otc-select, otc-input-date, otc-multivalue');
  }

  /**
   * Switching readonly/edit mode
   *
   * @param isEditMode
   * @private
   */
  _switchMode(isEditMode) {
    if (this.disabled) {
      return;
    }

    if (this.edit) {
      this._setFocusOnChildComponent();
      return;
    }

    this._isEditMode = isEditMode;

    if (isEditMode) {
      // Reset all child elements to their initial value.
      const childComponent = this._getChildComponent();
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
    const childComponent = this._getChildComponent();
    childComponent.updateComplete.then(() => {
      let focusElement;
      // The multi value can contain multiple components such as otc-input, otc-textarea and otc-select.
      // So we have to get the first element from its API to set focus on.
      if (this.#isChildMultiValue) {
        const { firstChildElement } = childComponent;
        focusElement = firstChildElement.shadowRoot.querySelector('input, textarea');
      } else {
        focusElement = childComponent.shadowRoot.querySelector('input, textarea');
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
        // Put focus back to the first element when the focus is on the cancel button.
        if (
          !this.edit
          && !event.shiftKey
          && this.shadowRoot.activeElement
          && this.shadowRoot.activeElement.className.indexOf('ot-inline-edit-container__cancel-btn') !== -1
        ) {
          event.preventDefault();
          this._setFocusOnChildComponent();
        } else if (
          !this.edit
          && event.shiftKey
          && document.activeElement.tagName === 'OTC-INPUT'
          && !this._isButtonTextFocused
        ) { // By navigation back put focus to the cancel button, when focus is not on a button text element.
          event.preventDefault();
          this._setFocusOnCancelButton();
        }
        break;
      case 'Enter': // Press enter on edit mode: save data. Press enter on read mode: open edit mode.
        if (event.target.tagName === 'OTC-INPUT') {
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
   * Handle action when the user clicks the save icon.
   *
   * @private
   */
  _handleSaveData() {
    if (this.disabled || !this._isEditMode || !this._isChildComponentValid()) {
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
    const childComponent = this._getChildComponent();

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
    const childComponent = this._getChildComponent();
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
    const childComponent = this._getChildComponent();

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
    if (this.disabled) {
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
    const childComponent = this._getChildComponent();

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
   * After the DOM has been updated the first time.
   *
   */
  async firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    this._isEditMode = this.edit;

    const readonlyValueButton = this.shadowRoot.querySelector('.ot-inline-edit-container__readonly-value-button');

    readonlyValueButton.addEventListener('focus', (el) => {
      this._isButtonTextFocused = true;
      if (el.target.matches(':focus-visible')) {
        this.shadowRoot.querySelector('.ot-inline-edit-container').classList.add('ot-inline-edit-container--show-edit-button');
      }
    });

    readonlyValueButton.addEventListener('blur', () => {
      this._isButtonTextFocused = false;
      this.shadowRoot.querySelector('.ot-inline-edit-container').classList.remove('ot-inline-edit-container--show-edit-button');
    });

    // Handle for the use of keyboard.
    this.addEventListener('keydown', (event) => {
      this._handleKeyboard(event);
    });

    const childComponent = this._getChildComponent();

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
    });

    childComponent.addEventListener('change', () => {
      this._handleValueChanged(childComponent);
      this.#generateReadonlyButtonText();
    });

    childComponent.addEventListener('value-changed', () => {
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

    const childComponent = this._getChildComponent();

    if (!childComponent) {
      return;
    }

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

    const childComponent = this._getChildComponent();
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
    };

    const displayTextClasses = {
      'ot-inline-edit-container__display-text': true,
      'ot-inline-edit-container__display-text--is-disabled': this.disabled,
      'ot-inline-edit-container__display-text--is-placeholder': !this.disabled && !this.value.length,
      'ot-inline-edit-container__display-text--is-dark': this.dark,
    };

    return html`<div class="${e(classes)}">${this.renderLabel()}<div class="ot-inline-edit-container__wrapper"><slot class="ot-inline-edit-container__child-wrapper"></slot><div class="ot-inline-edit-container__readonly-value-button-wrapper"><button @click="${() => this._switchMode(true)}" class="ot-inline-edit-container__readonly-value-button" aria-label="${this._getReadonlyButtonAriaLabel()}" aria-invalid="${this.getAriaInvalidRenderValue()}" title="${this.title}"><div class="${e(displayTextClasses)}">${this.#readOnlyButtonText}</div></button></div>${!this.disabled ? html`<div class="ot-inline-edit-container__btn-wrapper"><div class="ot-inline-edit-container__edit-btn-wrapper"><button @click="${() => this._switchMode(true)}" class="ot-inline-edit-container__edit-btn ot-btn ot-icon ot-icon--is-action-icon ot-icon--is-styleable-icon" aria-label="${this.editLabel}" title="${this.editLabel}" tabindex="-1">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION}:action_edit32`)}</button></div><div class="ot-inline-edit-container__edit-mode-btn-group"><button disabled="disabled" @click="${() => this._handleSaveData()}" class="ot-inline-edit-container__save-btn ot-btn ot-icon ot-icon--is-action-icon ot-icon--is-styleable-icon" aria-label="${this.saveLabel}" title="${this.saveLabel}">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION}:action_form_apply32`)}</button> <button @click="${() => this._handleCancelEdit()}" class="ot-inline-edit-container__cancel-btn ot-btn ot-icon ot-icon--is-action-icon ot-icon--is-styleable-icon" aria-label="${this.cancelLabel}" title="${this.cancelLabel}">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION}:action_form_cancel32`)}</button></div></div>`
    : html``
}</div>${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-inline-edit-container')) {
  customElements.define('otc-inline-edit-container', OtcInlineEditContainer);
}

export { OtcInlineEditContainer };
//# sourceMappingURL=otcInlineEditContainer.js.map
