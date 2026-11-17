import { html } from 'lit';
import { OtcSelectItem } from '../otcSelectItem.js';
import iconStyleSheet from '../../../styles/icons.scss.js';
import selectUserItemStyleSheet from './otcSelectUserItem.scss.js';
import { classMap as e } from '../../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Select User Item component is used to display user information and can also be used in an `otc-select` to select a user.
 * @prop {string} image A data URI representing an image.
 * @prop {string} initials A string containing the user initials.
 * @prop {string} value The value of the user select item.
 * @slot unnamed User name for the select user item.
 */
class OtcSelectUserItem extends OtcSelectItem {
  static get styles() {
    return [
      OtcSelectItem.styles,
      iconStyleSheet,
      selectUserItemStyleSheet,
    ];
  }

  static get properties() {
    return {
      image: { type: String, reflect: true },
      initials: { type: String, reflect: true },
      value: { type: String, reflect: true },
    };
  }

  constructor() {
    super();

    this.image = '';
    this.initials = '';
    this.value = '';
  }

  filterContent(/* filterValue */) {
  }

  restoreContent() {
  }

  render() {
    const isExtensible = !!this.querySelector('otc-usercard');
    const dropdownItemClasses = {
      'ot-select-user-item': true,
      'ot-select-user-item-extensible': isExtensible,
      'ot-dropdown__item': true,
      'ot-dropdown__item--is-selected': this.selected,
    };

    const avatarClasses = {
      'ot-select-user-item__svg': !isExtensible,
      'ot-select-user-item__svg-extensible': isExtensible,
    };

    return html`<div id="selectitem-dropdownitem" class="${e(dropdownItemClasses)}" ?selected="${this.selected}" .value="${this.value}" role="option" tabindex="-1" aria-selected="${this.selected}" @click="${this._handleClick}" @keydown="${this._handleKeyDown}"><otc-avatar class="${e(avatarClasses)}" initials="${this.initials}" image="${this.image}"></otc-avatar><div><slot></slot><slot name="usercard"></slot></div></div>`;
  }
}

if (!customElements.get('otc-selectuseritem')) {
  customElements.define('otc-selectuseritem', OtcSelectUserItem);
}

export { OtcSelectUserItem };
//# sourceMappingURL=otcSelectUserItem.js.map
