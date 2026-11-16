import { html } from 'lit';
import { DateTime } from 'luxon';
import { getDateTimeFormatPattern } from 'intl-datetimeformat-options';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { RTLController } from '../../controllers/rtlController.js';
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
import { OTC_ICON_BUNDLE_WC_ACTION, getSVGForIcon } from '../../utilities/render-utilities.js';
import { parseDateFromDateString, isTimeFormat, isAmPMFormat, getWeekStartDay, getDayLabelList, getMonthLabelList, get12HoursTimeAbbreviation } from './datepicker/datePicker-utility.js';
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
 */
class OtcInputDate extends FormElement {
  #rtlController = new RTLController(this);

  #documentClickHandler = this._handleDocumentClick.bind(this);

  constructor() {
    super();

    this.dateTime = false;
    this.displayValue = '';
    this.format = '';
    this.invalidDateErrorMessage = 'Invalid date input!';
    this.lang = '';
    this.placeholder = '';
    this.value = '';

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
    };

    return { ...FormElement._commonProperties, ...props };
  }

  /**
   * Open/close the date picker.
   *
   * @private
   */
  _toggleDatePicker() {
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
   * These input's value are set by the datepicker, when user selects a date.
   *
   * @param {Event} e
   * @private
   */
  _onValueUpdated(e) {
    const newValue = e.target.getAttribute('iso-value');

    if (this.value === newValue) {
      return;
    }

    this.value = newValue;
    this.displayValue = e.target.value;
    this.setInternalsFormValue(this.value);
    this.setCustomValidity('');

    this.triggerChangeEvent({
      value: {
        value: this.value,
        displayValue: this.displayValue,
      },
    });
  }

  /**
   * This method is called when user enters the date directly in the input.
   * The value will be checked if it's a valid string for date base on the format or not.
   *
   * By invalid input, the error message will be shown.
   *
   * @param {Event} e
   * @private
   */
  _onChange(e) {
    if (!e.target.value.length) {
      this.value = '';
      this.displayValue = '';
    } else {
      const dateValue = parseDateFromDateString(
        e.target.value,
        this._datePicker.config.format,
        this._datePicker.config.lang,
      );
      if (dateValue === null) {
        this.setCustomValidity(this.invalidDateErrorMessage);
      } else {
        this.setCustomValidity('');
        this._datePicker.reInit(this._datePicker.config, dateValue, true);
      }
    }
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
  _handleDocumentClick(event) {
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

      if (this._datePicker && outsideClick) {
        this._datePicker.close();
      }
    }
  }

  /**
   * Return true if some specific attribute is changed and has proper value.
   *
   * @param changedProperties
   * @returns {boolean}
   * @private
   */
  _shouldBeReInit(changedProperties) {
    // Catch the initial state, this happens when the component is set up for the first time.
    if (mapHasKey(changedProperties, 'format') && changedProperties.get('format') === undefined
      && mapHasKey(changedProperties, 'value') && changedProperties.get('value') === undefined
      && mapHasKey(changedProperties, 'displayValue') && changedProperties.get('displayValue') === undefined
      && mapHasKey(changedProperties, 'lang') && changedProperties.get('lang') === undefined
      && mapHasKey(changedProperties, 'dateTime') && changedProperties.get('dateTime') === undefined
    ) {
      return false;
    }

    return !!(mapHasKey(changedProperties, 'format')
      || mapHasKey(changedProperties, 'value')
      || mapHasKey(changedProperties, 'displayValue')
      || mapHasKey(changedProperties, 'dateTime')
      || mapHasKey(changedProperties, 'lang'));
  }

  /**
   * Return the config for the date picker
   *
   * @returns {{format: string, weekStartDay: number, lang: (string|string)}}
   * @private
   */
  _getDatePickerConfig() {
    const option = this._getLocaleAndDatePattern();

    return {
      lang: option.locale,
      format: option.format,
      timeSelection: isTimeFormat(option.format),
      amPmTime: isAmPMFormat(option.format),
      weekStartDay: getWeekStartDay(option.locale),
      weekdayLabelList: getDayLabelList(false, option.locale),
      weekdayShortLabelList: getDayLabelList(true, option.locale),
      monthLabelList: getMonthLabelList(false, option.locale),
      monthShortLabelList: getMonthLabelList(true, option.locale),
      twelveHoursTimeAbbreviation: get12HoursTimeAbbreviation(option.locale),
      isRTL: this.#rtlController.isRTL,
    };
  }

  /**
   * Return language and date pattern option, base on user's input or browser's setting.
   *
   * The lang attribute can be used to define both language and date format.
   * If there is value given for date format via the 'format' attribute.
   * It will be used and overwrite the value from 'lang' attribute.
   *
   * @returns {{format: string, locale: string}}
   * @private
   */
  _getLocaleAndDatePattern() {
    let format = '';
    let locale = '';

    if (this.lang.length) {
      locale = this.lang;
    } else { // If no language is provided, then try to get from the 'lang' attribute from the ancestors or the browser's language.
      locale = getLanguage(this);
    }

    if (this.format.length) { // If format is provided, then use it.
      format = this.format;
    } else { // If NO format is given, then get it from the library.
      format = this._getDateFormat(locale);
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
  _getDateFormat(locale) {
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
  _getDateValue(config, dateString) {
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

  _updateDisplayValue(config, dateValue) {
    const newDisplayValue = dateValue.toFormat(config.format, { locale: config.lang });

    if (this.displayValue !== newDisplayValue) {
      this.displayValue = dateValue.toFormat(config.format, { locale: config.lang });
    }

    this.dispatchEvent(new CustomEvent('value-changed', { detail: null, bubbles: true }));
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
   * Create and set up the date picker with proper config and date value.
   */
  firstUpdated() {
    const config = this._getDatePickerConfig();

    let dateValue;
    let updateDisplayValue = false;
    if (this.value.length) { // Try to get initial date from ISO value string first.
      updateDisplayValue = true;
      dateValue = DateTime.fromISO(this.value);
    } else { // If value is not set, then get initial date from displayValue string.
      dateValue = this._getDateValue(config, this.shadowRoot.querySelector('input').value);
    }

    this._datePicker = new DatePicker(this.shadowRoot.querySelector('input'));
    this._datePicker.init(config, dateValue);

    // Update display value must be run here after datepicker is created.
    if (updateDisplayValue) {
      this._updateDisplayValue(config, dateValue);
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

    if (this._shouldBeReInit(changedProperties)) {
      const config = this._getDatePickerConfig();

      let dateValue;
      if (changedProperties.has('value')) {
        if (!this.value.length) {
          this.displayValue = '';
          dateValue = DateTime.now();
        } else {
          dateValue = DateTime.fromISO(this.value);
          this._updateDisplayValue(config, dateValue);
        }
      } else {
        dateValue = this._getDateValue(config, this.displayValue);
      }

      this._datePicker.reInit(config, dateValue);
    }
  }

  /**
   * Render the component.
   *
   * @returns {TemplateResult<1>}
   */
  render() {
    const openPickerButtonAria = datePickerLang.OpenPickerButtonAria;
    const openPickerButtonTitle = datePickerLang.OpenPickerButtonTitle;

    const classes = {
      'ot-input-date': true,
      'ot-input-date--is-rtl': this.#rtlController.isRTL,
      'ot-input-date--is-readonly': this.readonly,
    };

    const option = this._getLocaleAndDatePattern();

    return html`<div class="${e({ ...this.getCommonFormClasses(), ...classes })}" role="none">${this.renderLabel()}<div class="ot-input-date__input-wrapper ot-form-control__input-group" role="none"><input class="ot-input ot-input-date__input" id="${this.id}" placeholder="${this.placeholder.length ? this.placeholder : option.format}" type="text" .value="${this.displayValue}" ?readonly="${this.readonly}" ?required="${this.required}" ?disabled="${this.disabled}" @value-updated="${this._onValueUpdated}" @change="${this._onChange}" @input="${this.#onInput}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-label="${this.ariaLabel}"> <button class="ot-input-date__toggle-picker-button ot-btn ot-icon ot-icon--is-action-icon ot-icon--is-styleable-icon" @click="${this._toggleDatePicker}" aria-label="${openPickerButtonAria}" title="${openPickerButtonTitle}" icon="${OTC_ICON_BUNDLE_WC_ACTION}:action_date32" ?disabled="${this.disabled}" ?hidden="${this.readonly}">${getSVGForIcon(`${OTC_ICON_BUNDLE_WC_ACTION}:action_date32`)}</button></div>${this.renderErrorMessage(this.validationMessage ? this.validationMessage : this.invalidDateErrorMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-input-date')) {
  customElements.define('otc-input-date', OtcInputDate);
}

export { OtcInputDate };
//# sourceMappingURL=otcInputDate.js.map
