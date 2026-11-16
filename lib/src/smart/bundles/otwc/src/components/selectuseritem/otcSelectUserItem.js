/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OtcSelectItem } from '../select/otcSelectItem.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Select User Item component is used to display user information and can also be used in an `otc-select` to select a user.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. header:header_user42. @deprecated - the icon property
 * will be removed with version 24.4. The default avatar is displayed if no icon, image and initials are specified.
 * @prop {string} image A data URI representing an image.
 * @prop {string} initials A string containing the user initials.
 * @prop {string} value The value of the user select item.
 * @slot unnamed User name for the select user item.
 */
class OtcSelectUserItem extends OtcSelectItem {
  static get styles() {
    return [
      iconStyleSheet,
      OtcSelectItem.styles,
    ];
  }

  static get properties() {
    return {
      icon: { type: String, reflect: true },
      image: { type: String, reflect: true },
      initials: { type: String, reflect: true },
      value: { type: String, reflect: true },
    };
  }

  constructor() {
    super();

    this.icon = '';
    this.image = '';
    this.initials = '';
    this.value = '';
  }

  filterContent(/* filterValue */) {
  }

  restoreContent() {
  }

  render() {
    const dropdownItemClasses = {
      'ot-user__dropdown__item': true,
      'ot-dropdown__item--is-selected': this.selected,
    };

    const isExtensible = !!this.querySelector('otc-usercard');
    const avatarClasses = {
      'ot-user__dropdown__svg': !isExtensible,
      'ot-user__dropdown__svg__extensible': isExtensible,
    };

    return html`<div id="selectuseritem-dropdownitem" class="${e(dropdownItemClasses)}" ?selected="${this.selected}" .value="${this.value}" role="option" tabindex="-1" aria-selected="${this.selected}" @click="${this._handleClick}" @keydown="${this._handleKeyDown}"><otc-avatar class="${e(avatarClasses)}" initials="${this.initials}" image="${this.image}" icon="${this.icon}"></otc-avatar><div><slot></slot><slot name="usercard"></slot></div></div>`;
  }
}

if (!customElements.get('otc-selectuseritem')) {
  customElements.define('otc-selectuseritem', OtcSelectUserItem);
}

export { OtcSelectUserItem };
//# sourceMappingURL=otcSelectUserItem.js.map
