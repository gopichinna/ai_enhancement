/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { DateTime } from 'luxon';
import { getDateTimeFormatPattern } from 'intl-datetimeformat-options';
import { actionCalendar } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { RTLController } from '../../controllers/rtlController.js';
import { ThemeController } from '../../controllers/themeController.js';
import { DatePicker } from './datepicker/datePicker.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import inputStyleSheet from '../input/otcInput.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import otcDateStyle from './otcInputDate.scss.js';
import datePickerStyle from './datepicker/datePicker.scss.js';
import datePickerLang from './datepicker/datepicker-lang.js';
import { mapHasKey, getLanguage } from '../../utilities/common-utilities.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../../utilities/render-utilities.js';
import { parseDateFromDateString, get12HoursTimeAbbreviation, getMonthLabelList, getDayLabelList, getWeekStartDay, isAmPMFormat, isTimeFormat } from './datepicker/datePicker-utility.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Input Date component is date type input with date picker.
 * @prop {boolean} dateTime Display time selection section and the date format with time.
 * This option is used only when the date format is NOT given, and the format is set automatically base on the language option.
 * @prop {string} displayValue The display value of the date input.
 * @prop {string} format Defines the format pattern for display and validation.
 * See the format section in the documentation for more details.
 * If there is no value provided, the format pattern bases on the language via the **lang** attribute will be used.
 * @prop {string} invalidDateErrorMessage Defines the error message that will be displayed when the user provides an invalid date format.
 * If you do not want to show the error message, you can provide an empty string to this attribute.
 * @prop {string} lang Defines both the date format pattern and the language display for the date picker.
 * If there is no value given, the language of the ancestor tag will be used.  When there is no language defined for the ancestors at all,
 * the browser language will be used.
 * **Note: ** If there is a value given for the **format** attribute, it will overwrite the value of lang/locale and will be used as format
 * for the input date.
 * @prop {string} placeholder The placeholder text for the input field. If there is no placeholder provided, the format will be used.
 * @prop {string} value The value of the date input.
 * @fires change Fired when a date is selected.
 * @fires value-changed **DEPRECATED: ** Fired every time value of the selected date has changed.
 * @fires valueChanged Fired every time value of the selected date has changed.
 */
class OtcInputDate extends FormElement {
  #rtlController = new RTLController(this);

  #documentClickHandler = this.#handleDocumentClick.bind(this);

  #themeController = new ThemeController(this);

  constructor() {
    super();

    this.dateTime = false;
    this.displayValue = '';
    this.format = '';
    this.invalidDateErrorMessage = 'Invalid date input!';
    this.lang = '';
    this.placeholder = '';
    this.value = '';
    this._programmaticOpen = false;

    /** @type {DatePicker} */
    this._datePicker = null;
  }

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      FormBase.getFormStyles(),
      inputStyleSheet,
      buttonStyleSheet,
      otcDateStyle,
      datePickerStyle,
    ];
  }

  static get properties() {
    const props = {
      dateTime: { type: Boolean, reflect: true },
      displayValue: { type: String, reflect: false },
      format: { type: String, reflect: true },
      invalidDateErrorMessage: { type: String, reflect: true },
      lang: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      value: { type: String, reflect: true },
      _programmaticOpen: { type: Boolean, state: true },
    };

    return { ...FormElement._commonProperties, ...ThemeController.properties, ...props };
  }

  /**
   * Open/close the date picker.
   *
   * @private
   */
  #toggleDatePicker() {
    if (this.readonly || this.disabled) {
      return;
    }

    if (!this._datePicker.isVisible) {
      this._datePicker.open();
    } else {
      this._datePicker.close();
    }
  }

  /**
   * Set value as the iso-value and display value as the value of the input.
   * These input's value is set by the datepicker when a user selects a date.
   *
   * @param {Event} e
   * @private
   */
  #onValueUpdated(e) {
    const newValue = e.target.getAttribute('iso-value');

    if (this.value === newValue) {
      return;
    }

    this.value = newValue;
    this.displayValue = e.target.value;

    this.setCustomValidity('');

    this.#handleValueChange();
  }

  /**
   * This method is called when a user enters the date directly in the input.
   * The value will be checked if it's a valid string for date base on the format or not.
   *
   * By invalid input, the error message will be shown.
   *
   * @param {Event} e
   * @private
   */
  #onChange(e) {
    if (!e.target.value.length) {
      this.value = '';
      this.displayValue = '';
      this.#handleValueChange();
    } else {
      const dateValue = parseDateFromDateString(
        e.target.value,
        this._datePicker.config.format,
        this._datePicker.config.lang,
      );
      if (dateValue === null) {
        this.setCustomValidity(this.invalidDateErrorMessage);
        this.value = e.target.value;
      } else {
        this.setCustomValidity('');
        this._datePicker.reInit(this._datePicker.config, dateValue, true);
      }
    }
  }

  /**
   * Update the value for the form and trigger a change event.
   */
  #handleValueChange() {
    // Set value for the form.
    this.setInternalsFormValue(this.value);

    // Trigger change event.
    this.triggerChangeEvent({
      value: {
        value: this.value,
        displayValue: this.displayValue,
      },
    });
  }

  /**
   * Reset the value and display value, when the input's value is cleared.
   *
   * @param {Event} e
   * @private
   */
  #onInput(e) {
    if (!e.target.value.length) {
      this.value = '';
      this.displayValue = '';
    }
  }

  /**
   * Detect outside click and close the date picker.
   *
   * @param {Event} event
   * @private
   */
  #handleDocumentClick(event) {
    if (typeof event.composedPath === 'function') {
      let outsideClick = true;
      event.composedPath().forEach((element) => {
        if (element.classList
          && (element.classList.contains('ot-input-date__toggle-picker-button')
            || element.classList.contains('ot-datepicker')
          )) {
          outsideClick = false;
        }
      });

      // We have to consider programmatic open here, because the leading application can have a button,
      // which call the .showPicker() API to open the date picker.
      // In this case, clicking on the button is the outside click, but it should not close the date picker.
      if (this._datePicker && outsideClick && !this._programmaticOpen) {
        this._datePicker.close();
      }
    }

    // Set the flag to false, so that the next outside click can close the date picker.
    this._programmaticOpen = false;
  }

  /**
   * Return true if some specific attribute is changed and has proper value.
   *
   * @param changedProperties
   * @returns {boolean}
   * @private
   */
  #shouldBeReInit(changedProperties) {
    // Catch the initial state, this happens when the component is set up for the first time.
    if (mapHasKey(changedProperties, 'format') && changedProperties.get('format') === undefined
      && mapHasKey(changedProperties, 'value') && changedProperties.get('value') === undefined
      && mapHasKey(changedProperties, 'displayValue') && changedProperties.get('displayValue') === undefined
      && mapHasKey(changedProperties, 'lang') && changedProperties.get('lang') === undefined
      && mapHasKey(changedProperties, 'dateTime') && changedProperties.get('dateTime') === undefined
      && mapHasKey(changedProperties, 'dateTime') && changedProperties.get('dateTime') === undefined

    ) {
      return false;
    }

    return !!(mapHasKey(changedProperties, 'format')
      || mapHasKey(changedProperties, 'value')
      || mapHasKey(changedProperties, 'displayValue')
      || mapHasKey(changedProperties, 'dateTime')
      || mapHasKey(changedProperties, '_themeIsCarbonFiber')
      || mapHasKey(changedProperties, 'lang'));
  }

  /**
   * Return the config for the date picker
   *
   * @returns {{format: string, weekStartDay: number, lang: (string|string)}}
   * @private
   */
  #getDatePickerConfig() {
    const option = this.#getLocaleAndDatePattern();

    return {
      lang: option.locale,
      format: option.format,
      timeSelection: isTimeFormat(option.format),
      amPmTime: isAmPMFormat(option.format),
      weekStartDay: getWeekStartDay(option.locale),
      weekdayLabelList: getDayLabelList('long', option.locale),
      weekdayShortLabelList: getDayLabelList(this._themeIsCarbonFiber ? 'short' : 'narrow', option.locale),
      monthLabelList: getMonthLabelList(false, option.locale),
      monthShortLabelList: getMonthLabelList(true, option.locale),
      twelveHoursTimeAbbreviation: get12HoursTimeAbbreviation(option.locale),
      isRTL: this.#rtlController.isRTL,
      isJATOTheme: !this._themeIsCarbonFiber,
    };
  }

  /**
   * Return language and date pattern option, base on user's input or browser's setting.
   *
   * The lang attribute can be used to define both language and date format.
   * If there is a value given for date format via the 'format' attribute.
   * It will be used and overwrite the value from 'lang' attribute.
   *
   * @returns {{format: string, locale: string}}
   * @private
   */
  #getLocaleAndDatePattern() {
    let format = '';
    let locale = '';

    if (this.lang.length) {
      locale = this.lang;
    } else { // If no language is provided, then try to get from the 'lang' attribute from the ancestors or the browser's language.
      locale = getLanguage(this);
    }

    if (this.format.length) { // If a format is provided, then use it.
      format = this.format;
    } else { // If NO format is given, then get it from the library.
      format = this.#getDateFormat(locale);
    }

    return { format, locale };
  }

  /**
   * Get date or date time format base on locale.
   *
   * @param {string} locale
   * @returns {string}
   * @private
   */
  #getDateFormat(locale) {
    let pattern;
    if (this.dateTime) {
      pattern = getDateTimeFormatPattern(locale, { dateStyle: 'short', timeStyle: 'short' });
    } else {
      pattern = getDateTimeFormatPattern(locale, { dateStyle: 'short' });
    }

    // Replace weird &nbsp; character, which comes from the Intl Object, with empty space.
    return pattern.replaceAll(/\u202f/g, ' ');
  }

  /**
   * Return a date object as value.
   *
   * @param {Object} config
   * @param {string} dateString
   *
   * @returns {DateTime}
   * @private
   */
  #getDateValue(config, dateString) {
    const dateValue = parseDateFromDateString(
      dateString.trim(),
      config.format,
      config.lang,
    );

    if (dateValue === null) {
      return DateTime.now();
    }

    return dateValue;
  }

  #updateDisplayValue(config, dateValue) {
    const newDisplayValue = dateValue.toFormat(config.format, { locale: config.lang });

    if (this.displayValue !== newDisplayValue) {
      this.displayValue = dateValue.toFormat(config.format, { locale: config.lang });
    }

    this.dispatchEvent(new CustomEvent('value-changed', { detail: null, bubbles: true }));
    this.dispatchEvent(new CustomEvent('valueChanged', { detail: null, bubbles: true })); // #3599171
  }

  /**
   * Bind handling method to detect outside click.
   */
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.#documentClickHandler);
  }

  /**
   * Unbind handling method to detect outside click.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#documentClickHandler);
  }

  /**
   * API method.
   * Do not rename or delete!
   *
   * Use to programmatically open the date picker.
   */
  showPicker() {
    // Set the flag for programmatic open.
    // This flag is used for the logic of closing the date picker in #handleDocumentClick()
    this._programmaticOpen = true;
    this._datePicker.open();
  }

  /**
   * Create and set up the date picker with proper config and date value.
   */
  firstUpdated() {
    const config = this.#getDatePickerConfig();

    let dateValue;
    let updateDisplayValue = false;
    if (this.value.length) { // Try to get the initial date from ISO value string first.
      updateDisplayValue = true;
      dateValue = DateTime.fromISO(this.value);
    } else { // If the value is not set, then get the initial date from displayValue string.
      dateValue = this.#getDateValue(config, this.shadowRoot.querySelector('input').value);
    }

    this._datePicker = new DatePicker(this.shadowRoot.querySelector('input'));
    this._datePicker.init(config, dateValue);

    // Update display value must be run here after datepicker is created.
    if (updateDisplayValue) {
      this.#updateDisplayValue(config, dateValue);
    }

    this.initInternalsForm(this.value);
    this.handleInvalidEvent();
  }

  /**
   * Reinitialize the date picker with new config (format etc...) when the attribute is changed.
   *
   * @param changedProperties
   */
  update(changedProperties) {
    super.update(changedProperties);

    if (this.#shouldBeReInit(changedProperties)) {
      const config = this.#getDatePickerConfig();

      let dateValue;
      if (changedProperties.has('value')) {
        if (!this.value.length) {
          this.innerInteractiveElement.value = '';
          this.setCustomValidity('');
          this.displayValue = '';
          dateValue = DateTime.now();
        } else {
          dateValue = DateTime.fromISO(this.value);

          if (dateValue.isValid) {
            this.#updateDisplayValue(config, dateValue);
          }
        }
      } else {
        dateValue = this.#getDateValue(config, this.displayValue);
      }

      if (dateValue && dateValue.isValid) {
        this._datePicker.reInit(config, dateValue);
      }
    }
  }

  /**
   * Render button to open/close the date picker.
   *
   * @returns {TemplateResult<1>}
   */
  #renderToggleButton() {
    if (this.readonly) {
      return html``;
    }

    // Render button with JATO Icon.
    if (!this._themeIsCarbonFiber) {
      return html`<otc-button @click="${this.#toggleDatePicker}" class="ot-input-date__toggle-picker-button" ariaLabel="${datePickerLang.OpenPickerButtonAria}" title="${datePickerLang.OpenPickerButtonTitle}" size="small" ?disabled="${this.disabled}"><otc-icon svg="${actionCalendar}"></otc-icon></otc-button>`;
    }

    // Render button with Carbon Fiber Icon.
    return html`<otc-button @click="${this.#toggleDatePicker}" class="ot-input-date__toggle-picker-button" arialabel="${datePickerLang.OpenPickerButtonAria}" title="${datePickerLang.OpenPickerButtonTitle}" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_date32" ?disabled="${this.disabled}"></otc-button>`;
  }

  /**
   * Render the component.
   *
   * @returns {TemplateResult<1>}
   */
  render() {
    const classes = {
      'ot-input-date': true,
      'ot-input-date--is-rtl': this.#rtlController.isRTL,
      'ot-input-date--is-readonly': this.readonly,
      'ot-input-date--is-jato': !this._themeIsCarbonFiber,
    };

    const inputClasses = {
      'ot-input': true,
      'ot-input--has-no-value': !this.value && this.readonly,
      'ot-input-date__input': true,
    };

    const option = this.#getLocaleAndDatePattern();
    const placeholderText = this.getPlaceholderText();

    const ariaInvalidValue = this.getAriaInvalidRenderValue();
    const errorMsgIfInvalid = this.validationMessage ? this.validationMessage : this.invalidDateErrorMessage;

    return html`<div class="${e({ ...this.getCommonFormClasses(), ...classes })}" role="none">${this.renderLabel()}<div class="ot-input-date__input-wrapper ot-form-control__input-group" role="none"><input class="${e(inputClasses)}" id="${this.id}" placeholder="${placeholderText.length ? placeholderText : option.format}" type="text" .value="${this.displayValue}" ?readonly="${this.readonly}" ?required="${this.required}" ?disabled="${this.disabled}" @value-updated="${this.#onValueUpdated}" @change="${this.#onChange}" @input="${this.#onInput}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-label="${this.ariaLabel || nothing}" aria-invalid="${ariaInvalidValue}" aria-required="${this.getAriaRequiredRenderValue()}"> ${this.#renderToggleButton()}</div>${this.renderErrorMessage(ariaInvalidValue === 'true' ? errorMsgIfInvalid : '')} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-input-date')) {
  customElements.define('otc-input-date', OtcInputDate);
}

export { OtcInputDate };
//# sourceMappingURL=otcInputDate.js.map
