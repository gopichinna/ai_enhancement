/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import { ElementBase } from '../element-base.js';
import { getSVGForIconWithOptions, getClassesForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Inline Actions component is used to create an inline actions menu.
 * Inline actions use progressive disclosure to offer access to just a few frequently used actions.
 * This technique exposes actions only when needed, and avoids cluttering the screen with options.
 * Inline actions are not available on touch-only devices since the inline action bar is triggered by a mouse over. Touch-only devices
 * will have a persistent approach (i.e. persistent actions within table toolbar or a persistent edit icon on a metadata form field).
 * @prop {boolean} disabled The disabled state of the inline action item.
 * @prop {string} href The URL of the destination for the link.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {boolean} menuOpen Indicates that the inline action item is associated with a menu that is currently open.
 * @prop {string} target Specifies the default target of the `href`.
 */
class OtcInlineActionItem extends ElementBase {
  constructor() {
    super();
    this.disabled = false;
    this.href = '';
    this.icon = '';
    this.menuOpen = false;
    this.target = '_self';
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
  }

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
    ];
  }

  static get properties() {
    return {
      disabled: { type: Boolean, reflect: true },
      href: { type: String, reflect: true },
      icon: { type: String, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
      target: { type: String, reflect: true },
    };
  }

  _onKeyUp(e) {
    if (e.altKey) {
      return;
    }

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        break;
    }
  }

  _onClick(e) {
    e.preventDefault();
  }

  render() {
    return html`<a aria-label="button" aria-expanded="${this.menuOpen}" ?disabled="${this.disabled}" href="${this.href}" .target="${this.target}" class="${e({ ...getClassesForIcon(this) })}" @click="${this._onClick}" @keyup="${this._onKeyUp}">${getSVGForIconWithOptions({ iconKey: this.icon }, { role: 'presentation' })}</a>`;
  }
}

if (!customElements.get('otc-inline-action-item')) {
  customElements.define('otc-inline-action-item', OtcInlineActionItem);
}

export { OtcInlineActionItem };
//# sourceMappingURL=otcInlineActionItem.js.map
