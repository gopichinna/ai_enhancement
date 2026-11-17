import { nothing, html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { OtcCheckboxBase } from '../checkbox/otcCheckboxBase.js';
import checkboxStyleSheet from '../checkbox/otcCheckbox.scss.js';
import menuCheckboxStyleSheet from './otcMenuCheckbox.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Checkbox component represents a dropdown menu checkbox.
 * @prop {boolean} altStyle  Render with a different style of checkmark, similar to the `altStyle` of `otc-checkbox`.
 * @prop {boolean} checked The checked state of the checkbox.
 * @prop {boolean} disabled The disabled state of the menu checkbox.
 * @prop {boolean} selectableStyle Render with a differentiating background color the checked state instead of a checkmark.
 * @slot unnamed Defines the text of the menu checkbox item.
 * @fires change Fired when the state of the menu checkbox has changed.
 * @fires input Fired when the state of the menu checkbox has changed.
 */
class OtcMenuCheckbox extends OtcCheckboxBase(OtcMenuItemBase) {
  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      checkboxStyleSheet,
      menuCheckboxStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      altStyle: { type: Boolean, reflect: true },
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      selectableStyle: { type: Boolean, reflect: true },
    };

    return { ...OtcMenuItemBase.properties, ...OtcCheckboxBase.properties, ...props };
  }

  constructor() {
    super();

    this.altStyle = false;
    this.checked = false;
    this.disabled = false;
    this.selectableStyle = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('click', this.#handleClick);
  }

  #handleClick(event) {
    if (!event.composedPath().some(el => el.matches?.('.ot-checkbox'))) {
      // We clicked on the menu item somewhere outside of the input.  We still want to toggle the checkbox.
      this.click();
    }
  }

  _getItemTemplate(role, type) {
    const dropdownItemClasses = {
      'ot-dropdown__item': true,
      ...this.baseClasses,
    };

    const inputTemplate = this.getInputTemplate({
      checked: this.checked,
      disabled: this.disabled,
      id: 'menucheckbox-input',
      readonly: this.readonly,
      type,
      hidden: true,
    });

    const otCheckboxClasses = {
      'ot-checkbox': true,
      'ot-checkbox--alt-style': this.altStyle,
      'ot-checkbox--normal-style': !this.altStyle,
      'ot-checkbox--disabled': this.disabled,
      'ot-checkbox--menu-item': true,
    };

    return html`<li class="${e(dropdownItemClasses)}" id="menucheckbox-dropdownitem" role="${role}" tabindex="-1" aria-checked="${this.checked}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}"><div class="${e(otCheckboxClasses)}"><div class="ot-checkbox__wrapper">${inputTemplate} ${this.getCheckboxWrapperTemplate()}</div></div></li>`;
  }

  render() {
    return this._getItemTemplate('menuitemcheckbox', 'checkbox');
  }
}

customElements.define('otc-menucheckbox', OtcMenuCheckbox);

export { OtcMenuCheckbox };
//# sourceMappingURL=otcMenuCheckbox.js.map
