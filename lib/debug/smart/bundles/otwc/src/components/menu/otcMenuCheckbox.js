import { html, nothing } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Checkbox component represents a dropdown menu checkbox.
 * @prop {boolean} checked The state of the menu checkbox item.
 * @prop {boolean} altStyle Enables alternate styling of the menu checkbox item.
 * @slot unnamed Defines the text of the menu checkbox item.
 */
class OtcMenuCheckbox extends OtcMenuItemBase {
  static get properties() {
    return {
      ...OtcMenuItemBase.properties,
      altStyle: { type: Boolean, reflect: true },
      checked: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();

    this.altStyle = false;
    this.checked = false;

    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('checked')) {
      // Update the state of the input checkbox.
      const input = this.#input;
      if (input) {
        input.checked = this.checked;
      }
    }
  }

  _dispatchChangeEvent(newValue) {
    // Dispatch a 'change' event with the checked state of the item.
    const eventDetails = { checked: newValue, name: this.textContent };
    this.dispatchEvent(new CustomEvent('change', {
      detail: eventDetails,
      bubbles: true,
    }));
  }

  _handleClick() {
    this._dispatchChangeEvent(!this.checked);
    this.checked = !this.checked;
  }

  _handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        this._handleClick();

        // Prevent the default action, otherwise Spacebar will also scroll the page.
        event.preventDefault();
        break;
    }
  }

  _handleInputClick(event) {
    // Prevent the default input handling.  We handle it ourselves when it bubbles up to the web component level.
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  get #input() {
    return this.shadowRoot?.querySelector('input');
  }

  _getItemTemplate(listItemId, listItemRole, divClass, inputId, inputType, inputClass, wrapperClass, iconClass, labelClass) {
    const dropdownItemClasses = {
      'ot-dropdown__item': true,
      ...this.baseClasses,
    };

    return html`<li class="${e(dropdownItemClasses)}" id="${listItemId}" role="${listItemRole}" tabindex="-1" aria-checked="${this.checked}"><div class="${divClass}"><input ?checked="${this.checked}" class="${inputClass.length > 0 ? inputClass : nothing}" id="${inputId}" tabindex="-1" type="${inputType}" hidden @click="${this._handleInputClick}"><div class="${wrapperClass}"><span class="${iconClass}" role="none"></span> <label class="${labelClass}" for="${inputId}"><slot></slot></label></div></div></li>`;
  }

  render() {
    return this._getItemTemplate(
      'menucheckbox-dropdownitem',
      'menuitemcheckbox',
      'ot-checkbox',
      'menucheckbox-input',
      'checkbox',
      (this.altStyle ? 'ot-checkbox__input-altstyle' : ''),
      'ot-checkbox__wrapper',
      'ot-checkbox__icon',
      'ot-checkbox__text',
    );
  }
}

customElements.define('otc-menucheckbox', OtcMenuCheckbox);

export { OtcMenuCheckbox };
//# sourceMappingURL=otcMenuCheckbox.js.map
