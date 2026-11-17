/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { actionSearchSmall, actionCloseSmall, actionChevronSmallRight } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { limitPropValConverter } from '../../utilities/common-utilities.js';
import { getSVGForIconWithOptions, OTC_ICON_BUNDLE_WC_ACTION_16, OTC_ICON_BUNDLE_WC_UTILITY } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import inputStyleSheet from './otcInput.scss.js';
import floatingLabelInputStyles from './otcFloatingLabelInput.scss.js';
import { RTLController } from '../../controllers/rtlController.js';
import { ThemeController } from '../../controllers/themeController.js';
import '../../../lib/otc-icons/icons_otc-utility.js';
import '../../../lib/otc-icons/icons_otc-action_16.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Input component is similar to a standard input element and allows the user to enter and edit text values in one line.
 * @prop {string} actionIcon For **CarbonFiber** theme: It's a string containing the icon bundle and icon name,
 * e.g. `action:action_cancel32`.<br><br> For **JATO** theme: It's a string containing the SVG markup of the icon.
 * @prop {string} actionIconAriaLabel The `aria-label` of the action icon button.
 * @prop {string} actionIconTitle The `title` of the action icon button.
 * @prop {string} autocomplete The `autocomplete` attribute of the input.
 * @prop {string} clearIcon For **CarbonFiber** theme: It's a string containing the icon bundle and icon name,
 * e.g. `action:action_close_min32`.<br><br> For **JATO** theme: It's a string containing the SVG markup of the icon.<br>
 * <br>Only used with type=`search`.
 * @prop {string} clearIconAriaLabel The `aria-label` of the clear keywords icon button.<br>Only used with type=`search`.
 * @prop {string} clearIconTitle The `title` of the clear keywords icon button.<br>Only used with type=`search`.
 * @prop {string} closeIconAriaLabel The `aria-label` of the close icon button. Only used with type=`search` and `slidein`.
 * @prop {string} closeIconTitle The `title` of the close icon button. Only used with type=`search` and `slidein`.
 * @prop {string} closeIcon For **CarbonFiber** theme: It's a string containing the icon bundle and icon name,
 * e.g. `action_16:action_caret_right16`.<br><br> For **JATO** theme: It's a string containing the SVG markup of the icon.<br>
 * <br>Only used with type=`search` and `slidein`.
 * @prop {boolean} floatingLabel Render the input using the floating label style.  This style is only intended to be used in limited use
 * cases where the placeholder text doubles as the label and it's important for that label to remain visible at all times.
 * @prop {boolean} hideDecorativeIcon Hide the decorative icon in placeholder.<br>Only used with type=`search`.
 * @prop {boolean} isOpen Flag if `search` input field with property `slidein` is displayed opened or closed.
 * <br>Only used with type=`search` and `slidein`.
 * @prop {string} max Used for input type `number`. It's the maximum value to accept for this input. If the value entered into the element
 * exceeds this, the element fails constraint validation. If the value of the max attribute isn't a number, then the element has no maximum
 * value.
 * @prop {number} maxLength Sets the maximum number of characters available in the input field.
 * @prop {string} min Used for input type `number`. It's the minimum value to accept for this input. If the value of the element is less
 * than this, the element fails constraint validation. If a value is specified for min that isn't a valid number, the input has no minimum
 * value.
 * @prop {number} minLength Sets the minimum number of characters available in the input field.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the input has no value.
 * @prop {boolean} secondary Enables/disables forms 2.0 look for the input web component.
 * @prop {boolean} showArrowsForInputNumber Show the input arrows for input with type number.
 * @prop {boolean} slidein Enables slidein functionality, especially the close button for the input field.<br>Only used with type=`search`.
 * @prop {string} step Used for input type `number`. It's a number that specifies the granularity that the value must adhere to. Only values
 * which are equal to the basis for stepping are valid. **Note:** The default stepping value for number inputs is 1, allowing only integers
 * to be entered—unless the stepping base is not an integer.
 * @prop {string} title The `tooltip` of the otc-input. The default of '' avoids browser interference.
 * @prop {string} type Defines the type of the input. Available options are: `text`, `search`,
 * `number`, `password`, `url`, `email`, and `tel`.
 * @prop {string} value The value of the input.
 * @prop {boolean} whiteBackground Set the input background to white color.
 * @fires action-icon-clicked **DEPRECATED:** Fired when the action icon button is clicked.
 * @fires actionIconClicked Fired when the action icon button is clicked.
 * @fires closing Fired when in the input search field the close button is clicked.
 * @fires change Fired when the input operation has finished by pressing Enter or on focusout.
 * @fires input Fired when the value of the input changes at each keystroke and when a suggestion item has been selected.
 * @fires close Fired when input search field is fully closed.
 * @fires open Fired when the input search field is fully opened.
 * @fires value-changed **DEPRECATED:** Fired every time value of the input has changed, including programmatically.
 * @fires valueChanged Fired every time value of the input has changed, including programmatically.
 */
class OtcInput extends FormElement {
  #rtlController = new RTLController(this);

  #partRefs = {
    input: e(),
    closeButton: e(),
  };

  #inputIsFocused = false;

  #isTypeSearch = false;

  #themeController = new ThemeController(this);

  constructor() {
    super();

    this.actionIcon = '';
    this.actionIconAriaLabel = '';
    this.actionIconTitle = '';
    this.autocomplete = null;
    this.clearIcon = '';
    this.clearIconAriaLabel = '';
    this.clearIconTitle = '';
    this.closeIcon = '';
    this.closeIconAriaLabel = '';
    this.closeIconTitle = '';
    this.floatingLabel = false;
    this.hideDecorativeIcon = false;
    this.isOpen = false;
    this.max = '';
    this.maxLength = -1;
    this.min = '';
    this.minLength = -1;
    this.placeholder = '';
    this.secondary = false;
    this.showArrowsForInputNumber = false;
    this.slidein = false;
    this.step = '';
    this.title = '';
    this.type = 'text';
    this.value = '';
    this.whiteBackground = false;

    // not reflected variables
    this._doAnimations = false;
    this._hideDecoIcon = this.hideDecorativeIcon;
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      inputStyleSheet,
      floatingLabelInputStyles,
    ];
  }

  static get properties() {
    const props = {
      actionIcon: { type: String, reflect: true },
      actionIconAriaLabel: { type: String, reflect: true },
      actionIconTitle: { type: String, reflect: true },
      autocomplete: { type: String, reflect: true },
      clearIcon: { type: String, reflect: true },
      clearIconAriaLabel: { type: String, reflect: true },
      clearIconTitle: { type: String, reflect: true },
      closeIcon: { type: String, reflect: true },
      closeIconAriaLabel: { type: String, reflect: true },
      closeIconTitle: { type: String, reflect: true },
      floatingLabel: { type: Boolean, reflect: true },
      hideDecorativeIcon: { type: Boolean, reflect: true },
      isOpen: { type: Boolean, reflect: true },
      max: { type: String, reflect: true },
      maxLength: { reflect: true, converter: limitPropValConverter },
      min: { type: String, reflect: true },
      minLength: { reflect: true, converter: limitPropValConverter },
      placeholder: { type: String, reflect: true },
      secondary: { type: Boolean, reflect: true },
      showArrowsForInputNumber: { type: Boolean, reflect: true },
      slidein: { type: Boolean, reflect: true },
      step: { type: String, reflect: true },
      title: { type: String, reflect: true },
      type: { type: String, reflect: true },
      value: { type: String, reflect: true },
      whiteBackground: { type: Boolean, reflect: true },
    };

    return { ...FormElement._commonProperties, ...ThemeController.properties, ...props };
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    if (this.validity && this.validity.valid === false && this.disabled) {
      this.disabled = false;
    }

    this.innerInteractiveElement.value = this.value;

    this.initInternalsForm(this.value);
    this.handleInvalidEvent();
  }

  willUpdate(changedProperties) {
    // Provide animations, also with programmatic change of 'isOpen', except for first rendering.
    // The isTypeSearch is set after first rendering, so we can use this instead of this.updated
    if (this.slidein && this.#isTypeSearch && changedProperties.has('isOpen')
      && changedProperties.get('isOpen') !== this.isOpen) {
      this._doAnimations = true;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Invalid type.  Reset to 'text'.
    if (!['text', 'search', 'password', 'url', 'email', 'tel', 'number'].includes(this.type.toLowerCase())) {
      this.type = 'text';
    }

    this.#isTypeSearch = this.type.toLowerCase() === 'search';

    if (this.slidein && this.#isTypeSearch) {
      // Reset animations flag.
      if (this._doAnimations) {
        this._doAnimations = false;
      }

      // This is also executed after the very first update since we do not test additionally against undefined.
      // This is intended since this gives the implementor the possibility to open a menu.
      if (changedProperties.has('isOpen')
        && changedProperties.get('isOpen') !== this.isOpen) {
        const elemWithAnims = this.shadowRoot.querySelector('.ot-input-search');
        const inputAnimationReadyPromise = elemWithAnims.getAnimations({ subtree: true }).map(animation => animation.ready);

        Promise.allSettled(inputAnimationReadyPromise).then(() => {
          // exclude decorative icon from animation
          this._hideDecoIcon = true;
        });

        const inputAnimationPromises = elemWithAnims.getAnimations({ subtree: true }).map(animation => animation.finished);
        const eventType = this.isOpen ? 'open' : 'close';

        // Disable close button to avoid "hammering" on close
        const closeButton = this.#partRefs.closeButton.value;
        if (closeButton) {
          closeButton.disabled = true;
        }

        // The event will only be dispatched when animations have finished.
        // If you interrupt the animation processing, no event may be sent.
        Promise.allSettled(inputAnimationPromises).then(async () => {
          // enable close button again
          if (closeButton) {
            closeButton.disabled = false;
          }

          // In case of close, clear the value after the animation
          if (!this.open) {
            this.value = '';
            this._hideDecoIcon = this.hideDecorativeIcon;
          }

          await this.updateComplete;

          // Send event
          const myEvent = new CustomEvent(eventType, { bubbles: true, composed: true });
          this.dispatchEvent(myEvent);
        });
      }
    }

    if (changedProperties.has('value') && changedProperties.get('value') !== undefined) {
      this.dispatchEvent(new CustomEvent('value-changed', { detail: null, bubbles: true }));
      this.dispatchEvent(new CustomEvent('valueChanged', { detail: null, bubbles: true })); // #3599171

      // SVF-4490: Special handling for abnormal behavior of minLength validation for HTML input.
      // When value is set to the native input element via property `.value=""` in render markup,
      // then the validation of the input gets valid state, even though the minLength is not reached.
      if (this.innerInteractiveElement.value !== this.value) {
        this.innerInteractiveElement.value = this.value;
        this.checkValidity(false);
      }
    }

    this.#handleCustomActionIcons();
  }

  select() {
    this.#partRefs.input.value?.select();
  }

  /**
   * In case, action icon(s) are configured via the slot.
   * set the padding-inline-end with the right value for the input field, so that the input text is not covered by the action icons.
   */
  #handleCustomActionIcons() {
    const customActionIcons = this.shadowRoot.querySelector('.ot-input__custom-action-icons');

    if (!this.#partRefs.input.value || !customActionIcons || customActionIcons.assignedNodes().length < 1) {
      return;
    }

    this.#partRefs.input.value.style.paddingInlineEnd = `${customActionIcons.offsetWidth + 4}px`;
  }

  #renderSearchIcon() {
    if (!this.#isTypeSearch || this.hideDecorativeIcon || this._hideDecoIcon || this.#inputIsFocused || this.value.length) {
      return html``;
    }

    if (this.#isTypeSearch && this.readonly) {
      return html``;
    }

    if (this._themeIsCarbonFiber) {
      return html`<div class="ot-input-search__search-icon ot-icon--is-action-icon">${getSVGForIconWithOptions({ iconKey: `${OTC_ICON_BUNDLE_WC_UTILITY}:utility_search12` }, { role: 'presentation' })}</div>`;
    }

    return html`<div class="ot-input-search__search-icon ot-input-search__search-icon--is-jato"><otc-icon size="16px" svg="${actionSearchSmall}" isPresentation></otc-icon></div>`;
  }

  #onActionIconClicked() {
    if (this.#isTypeSearch) {
      this.value = '';
      this.updateComplete.then(() => {
        const inputField = this.shadowRoot.querySelector('input.ot-input');
        inputField.focus();
      });

      // Trigger input event, because the value is reset.
      this.dispatchEvent(new CustomEvent('input', { detail: null, bubbles: true }));
    }

    this.dispatchEvent(new CustomEvent('action-icon-clicked', { detail: null, bubbles: true }));
    this.dispatchEvent(new CustomEvent('actionIconClicked', { detail: null, bubbles: true })); // #3599171
  }

  #handleKeyboardOnActionButton(event) {
    if (event.key === 'Enter') {
      event.stopPropagation(); // #4652750: don't propagate Enter, because in inline edit container it would call save
    }
  }

  #renderActionIcon() {
    if (this.readonly) {
      return html``;
    }

    let btnIcon = this.actionIcon;
    let btnTitle = this.actionIconTitle;
    let btnAriaLabel = this.actionIconAriaLabel;
    const isSearchWithValue = this.#isTypeSearch && this.value.length;

    if (isSearchWithValue) {
      btnTitle = this.clearIconTitle;
      btnAriaLabel = this.clearIconAriaLabel;
    }

    // Render button with JATO Icon.
    if (!this._themeIsCarbonFiber) {
      if (isSearchWithValue) {
        btnIcon = this.clearIcon ? this.clearIcon : `${actionCloseSmall}`;
      }

      return btnIcon.length ? html`<otc-button @click="${this.#onActionIconClicked}" @keydown="${this.#handleKeyboardOnActionButton}" class="ot-input__action-icon ot-input__action-icon--is-jato" ariaLabel="${btnAriaLabel}" size="small" title="${btnTitle}" ?disabled="${this.disabled}"><otc-icon svg="${btnIcon}"></otc-icon></otc-button>` : html`<slot name="action-icons" class="ot-input__custom-action-icons"></slot>`;
    }

    // Render button with CarbonFiber Icon.
    if (isSearchWithValue) {
      btnIcon = this.clearIcon ? this.clearIcon : `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_close16`;
    }

    return btnIcon.length ? html`<otc-button @click="${this.#onActionIconClicked}" @keydown="${this.#handleKeyboardOnActionButton}" class="ot-input__action-icon" ariaLabel="${btnAriaLabel}" title="${btnTitle}" icon="${btnIcon}" ?disabled="${this.disabled}"></otc-button>` : html`<slot name="action-icons" class="ot-input__custom-action-icons"></slot>`;
  }

  #onCloseIconClicked() {
    if (this.#isTypeSearch && this.slidein) {
      // we do not clear the value here since the field is still visible

      // Trigger input event, because the value is reset.
      this.dispatchEvent(new CustomEvent('input', { detail: null, bubbles: true }));

      // we don't change the isOpen flag, since the user may perform additional things e.g. close menu
      // before he updates the isOpen flag
      this.dispatchEvent(new CustomEvent('closing', { detail: null, bubbles: true }));
    }
  }

  #renderCloseIcon() {
    if (!this.#isTypeSearch || !this.slidein) {
      return html``;
    }

    if (this._themeIsCarbonFiber) {
      // Render button with CarbonFiber Icon.
      let icon;
      if (this.closeIcon) {
        icon = this.closeIcon;
      } else {
        icon = this.#rtlController.isRTL ? `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_left16`
          : `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_right16`;
      }
      return html`<div class="ot-input-search__close-button-container"><otc-button ${n(this.#partRefs.closeButton)} @click="${this.#onCloseIconClicked}" class="ot-input-search__close-icon" ariaLabel="${this.closeIconAriaLabel}" title="${this.closeIconTitle}" icon="${icon}"></otc-button></div>`;
    }
    // Render button with JATO Icon.
    const closeIcon = this.closeIcon ? this.closeIcon : actionChevronSmallRight;
    return html`<div class="ot-input-search__close-button-container"><otc-button ${n(this.#partRefs.closeButton)} @click="${this.#onCloseIconClicked}" class="ot-input-search__close-icon ot-input-search__close-icon--is-jato" ariaLabel="${this.closeIconAriaLabel}" title="${this.closeIconTitle}" size="small"><otc-icon ?mirrorIfRtl="${this.#rtlController.isRTL}" svg="${closeIcon}"></otc-icon></otc-button></div>`;
  }

  #handleInputBlur() {
    if (this.#isTypeSearch) {
      this.#inputIsFocused = false;
      this.requestUpdate(); // rerender, because #inputIsFocused changed
    }

    if (this.floatingLabel) {
      this.#partRefs.input.value.placeholder = '';
    }
  }

  #handleInputChange() {
    this.triggerChangeEvent();
  }

  #handleInputFocus() {
    if (this.#isTypeSearch) {
      this.#inputIsFocused = true;
      // allow decorative icon again, since focus was set after a possible animation
      this._hideDecoIcon = this.hideDecorativeIcon;
      this.requestUpdate(); // rerender, because #inputIsFocused changed
    }

    if (this.floatingLabel) {
      if (this.value.length === 0 && this.placeholder.length > 0) {
        this.#partRefs.input.value.placeholder = this.placeholder;
      }
    }
  }

  #handleInputInput(event) {
    this.value = event.target.value;
    this.setInternalsFormValue(this.value);

    if (this.floatingLabel) {
      if (this.value.length === 0 && this.placeholder.length > 0) {
        this.#partRefs.input.value.placeholder = this.placeholder;
      }
    }
  }

  #getFloatingLabelInputTemplate() {
    const formWrapperClasses = {
      ...this.getCommonFormClasses(),
      'ot-input--is-right': this.#rtlController.isRTL,
    };

    const inputWrapperClass = {
      'otc-floating-label-input-wrapper': true,
      'otc-floating-label-input-wrapper-readonly': this._themeIsCarbonFiber && this.readonly,
    };

    const inputClass = {
      'otc-floating-label-input': true,
      'otc-floating-label-input-has-value': this.value.length > 0,
    };

    return html`<div class="${e$1(formWrapperClasses)}" role="none"><div class="${e$1(inputWrapperClass)}"><input ${n(this.#partRefs.input)} autocomplete="${this.autocomplete?.length > 0 ? this.autocomplete : nothing}" class="${e$1(inputClass)}" ?disabled="${this.disabled}" id="${this.id}" label="${this.label}" ?liveValidation="${this.liveValidation}" max="${(this.type === 'number' && this.max.length) > 0 ? this.max : nothing}" maxLength="${this.maxLength >= 0 ? this.maxLength : nothing}" min="${(this.type === 'number' && this.min.length) > 0 ? this.min : nothing}" minLength="${this.minLength >= 0 ? this.minLength : nothing}" ?readonly="${this._themeIsCarbonFiber && this.readonly}" ?required="${this.required}" step="${(this.type === 'number' && this.step.length) > 0 ? this.step : nothing}" title="${this.title}" .type="${this.type.toLowerCase()}" @blur="${this.#handleInputBlur}" @change="${this.#handleInputChange}" @input="${this.#handleInputInput}" @focus="${this.#handleInputFocus}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" aria-required="${this.getAriaRequiredRenderValue()}"><div class="otc-floating-label-input-label-wrapper">${this.renderLabel()}</div>${this.#renderActionIcon()}</div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }

  render() {
    if (this.floatingLabel) {
      return this.#getFloatingLabelInputTemplate();
    }

    const elementClasses = {
      ...this.getCommonFormClasses(),
      'ot-input-search': this.type.toLowerCase() === 'search', // don't move this class, otherwise also change otc-filter-slidein
      'ot-input--is-right': this.#rtlController.isRTL,
      'ot-input--close-anim': this.slidein && this._doAnimations && !this.isOpen, // don't move this, otherwise change otc-filter-slidein
      'ot-input--open-anim': this.slidein && this._doAnimations && this.isOpen, // don't move this, otherwise change otc-filter-slidein
    };
    const inputClass = {
      'ot-input': true,
      'ot-input--is-dark': this.dark,
      'ot-input--is-secondary': this.secondary,
      'ot-input--white-background': this.whiteBackground,
      'ot-input--has-no-value': !this.value && this.readonly,
      'ot-input--hide-number-arrows': this.type === 'number' && !this.showArrowsForInputNumber,
      'ot-input--placeholder-fade-in': this.slidein && this.isOpen,
      'ot-input--placeholder-fade-out': this.slidein && !this.isOpen,
    };

    // MaxLength and MinLength are propagated to attributes, because the built-in
    // property setters throw if a negative value is passed to them. The source
    // for propagation is not an attribute, because the constructor initializes
    // properties and their values are reflected to attributes asynchronously
    // after the first rendering.
    return html`<div class="${e$1(elementClasses)}" role="none">${this.renderLabel()}<div class="ot-form-control__input-group" role="none"><div class="ot-input__icons">${this.#renderCloseIcon()} ${this.#renderSearchIcon()}</div><input ${n(this.#partRefs.input)} autocomplete="${this.autocomplete?.length > 0 ? this.autocomplete : nothing}" class="${e$1(inputClass)}" ?disabled="${this.disabled}" id="${this.id}" max="${(this.type === 'number' && this.max.length) > 0 ? this.max : nothing}" maxLength="${this.maxLength >= 0 ? this.maxLength : nothing}" min="${(this.type === 'number' && this.min.length) > 0 ? this.min : nothing}" minLength="${this.minLength >= 0 ? this.minLength : nothing}" placeholder="${this.getPlaceholderText()}" ?readonly="${this.readonly}" ?required="${this.required}" step="${(this.type === 'number' && this.step.length) > 0 ? this.step : nothing}" title="${this.title}" .type="${this.type.toLowerCase()}" @blur="${this.#handleInputBlur}" @change="${this.#handleInputChange}" @focus="${this.#handleInputFocus}" @input="${this.#handleInputInput}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" aria-required="${this.getAriaRequiredRenderValue()}"> ${this.#renderActionIcon()}</div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-input')) {
  customElements.define('otc-input', OtcInput);
}

export { OtcInput };
//# sourceMappingURL=otcInput.js.map
