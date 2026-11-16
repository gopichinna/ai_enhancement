/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { limitPropValConverter } from '../../utilities/common-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcTextarea.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Text Area component allows the user to enter and edit textual values.
 * @prop {boolean} autoresize Enable autoresize.  When `autoresize` is true, the rows attribute is treated as the minimum number of rows.
 * @prop {number} maxLength Sets the maximum number of characters available in the textarea.
 * @prop {number} maxRows Sets the maximum number of rows that the textarea will grow to when `autoresize` is true.
 * @prop {number} minLength Sets the minimum number of characters available in the textarea.
 * @prop {string} name Name of the textarea.
 * @prop {string} placeholder Defines a short hint intended to aid the user with data entry when the textarea has no value.
 * @prop {number} rows Number of rows for the textarea.  When `autoresize` is false, this is the fixed number of rows to display.  When
 * `autoresize` is true, this is the minimum number of rows to display.
 * @prop {boolean} secondary Enables forms 2.0 look for the textarea web component.
 * @prop {string} title The `tooltip` of the otc-textarea. The default of '' avoids browser interference.
 * @prop {string} value The value of the text area.
 * @cssprop [--ot-textarea-padding-block-start=4px] The block start padding of the textarea.
 * @cssprop [--ot-textarea-padding-block-end=4px] The block end padding of the textarea.
 * @cssprop [--ot-textarea-padding-inline-start=8px] The inline start padding of the textarea.
 * @cssprop [--ot-textarea-padding-inline-end=8px] The inline end padding of the textarea.
 * @slot unnamed The text content of the text area.  **Note:** Only text content will be rendered.
 * @fires input Fired when the value of the textarea changes at each keystroke.
 * @fires change Fired when the value of the textarea changes and looses focus.
 */
class OtcTextArea extends FormElement {
  #textAreaRef = e();

  #mutationObserver = new MutationObserver(this.#handleTextMutation.bind(this));

  #resizeObserver = new ResizeObserver(this.#handleResize.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      autoresize: { type: Boolean, reflect: true },
      maxLength: { reflect: true, converter: limitPropValConverter },
      maxRows: { type: Number, reflect: true },
      minLength: { reflect: true, converter: limitPropValConverter },
      name: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      rows: { type: Number, reflect: true },
      secondary: { type: Boolean, reflect: true },
      title: { type: String, reflect: true },
      value: { type: String, reflect: true },
      _textareaRows: { state: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  constructor() {
    super();

    this.autoresize = false;
    this.maxLength = 50;
    this.maxRows = 0;
    this.minLength = 0;
    this.name = '';
    this.placeholder = '';
    this.rows = 3;
    this.secondary = false;
    this.title = '';
    this.value = '';
    this._textareaRows = this.rows;
  }

  shouldUpdate(changedProperties) {
    // Prevent negative values for `minLength`.
    if (changedProperties.has('minLength') && this.minLength < 0) {
      // Reset back to the default.
      this.minLength = 0;
      return false;
    }

    // Prevent negative values for `rows`.
    if (changedProperties.has('rows') && this.rows < 0) {
      // Reset back to the default.
      this.rows = 3;
      return false;
    }

    return true;
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    // If we were created with text in between the `otc-textarea` tags, set it to the `value` property now.
    if (this.textContent) {
      this.value = this.textContent;
    }

    this.initInternalsForm(this.value);
    this.handleInvalidEvent();
  }

  updated(changedProperties) {
    super.updated?.(changedProperties);

    // When any property that could affect the size of the text changes, we must recalculate the number of rows displayed.
    if (changedProperties.has('autoresize') || changedProperties.has('maxLength') || changedProperties.has('maxRows')
        || changedProperties.has('minLength') || changedProperties.has('rows') || changedProperties.has('value')) {
      this.#setAutoresizeRows();
    }

    if (changedProperties.has('value')) {
      // Truncate any value greater than `maxLength`.
      if ((this.maxLength > 0) && (this.value?.length > this.maxLength)) {
        this.value = this.value.slice(0, this.maxLength);
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    // Watch for changes in the text content.
    this.#mutationObserver.observe(this, { characterData: true, childList: true, subtree: true });

    // Watch for changes in size.
    this.#resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove any handlers that were added in connectedCallback().
    this.#resizeObserver.disconnect();
    this.#mutationObserver.disconnect();
  }

  onInput(event) {
    this.value = event.target.value;
    this.setInternalsFormValue(this.value);
  }

  onChange(event) {
    this.value = event.target.value;
    this.triggerChangeEvent();
  }

  #handleTextMutation() {
    if (this.textContent) {
      this.value = this.textContent;
    }
  }

  #handleResize() {
    this.#setAutoresizeRows();
  }

  #setAutoresizeRows() {
    const textarea = this.#textAreaRef.value;

    if (!this.autoresize) {
      // Reset the textarea rows.
      this._textareaRows = this.rows;
    } else {
      // Temporarily set the textarea to 1 row so that we can get the true height of the text without the blank space that could be
      // displayed by having a `rows` value greater than necessary for the given text.
      textarea.rows = 1;

      // Get the top and bottom padding of the textarea.
      const textareaPadding = parseInt(getComputedStyle(textarea).paddingBottom, 10) + parseInt(getComputedStyle(textarea).paddingTop, 10);

      // Get the height of the textarea, not including the padding.
      const textareaScrollHeight = textarea.scrollHeight - textareaPadding;

      // Reset the textarea rows back to its initial value.
      textarea.rows = this._textareaRows;

      // Get the line height of the textarea.
      const textareaLineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);

      // Calculate the number of rows necessary to display the text.
      let newRows = Math.floor(textareaScrollHeight / textareaLineHeight);

      // If `maxRows` is set, ensure that `newRows` does not exceed the specified value.
      if (this.maxRows > 0) {
        newRows = Math.min(newRows, this.maxRows);
      }

      // Set the textarea rows to the greater of `newRows` and the `rows` property, which we treat as the minimum number of rows when
      // `autoresize` is enabled.
      this._textareaRows = Math.max(newRows, this.rows);
    }
  }

  render() {
    const textareaClasses = {
      'ot-textarea': true,
      'ot-scrollbar': true,
      'otc-textarea--is-autoresize': this.autoresize,
      'ot-textarea--is-secondary': this.secondary,
    };

    return html`<div class="${e$1(this.getCommonFormClasses())}">${this.renderLabel()}<div class="ot-form-control__input-group"><textarea ${n(this.#textAreaRef)} class="${e$1(textareaClasses)}" .name="${this.name}" .id="${this.id}" rows="${this._textareaRows}" maxlength="${this.maxLength >= 0 ? this.maxLength : nothing}" minlength="${this.minLength >= 0 ? this.minLength : nothing}" .placeholder="${this.placeholder}" ?readonly="${this.readonly}" ?disabled="${this.disabled}" ?required="${this.required}" @input="${this.onInput}" @change="${this.onChange}" aria-required="${this.getAriaRequiredRenderValue()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" title="${this.title}" .value="${this.getValueText()}"></textarea></div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

customElements.define('otc-textarea', OtcTextArea);

export { OtcTextArea };
//# sourceMappingURL=otcTextArea.js.map
