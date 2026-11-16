/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcBadge.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Badge component is a small round element containing text, usually used to indicate the count of an associated element.
 * @prop {boolean} isActive Indicates that the badge is active (e.g. part of a button being clicked) and should change its styling.
 * @prop {boolean} forToolbar Indicates that the badge is part of a toolbar and should change its styling.<br>**DEPRECATED:** Use `type`.
 * @prop {boolean} secondary Indicates that the badge should use its secondary styling.<br>**DEPRECATED:** Use `type`.
 * @prop {string} type Indicates the type of badge for styling purposes: `notification`, `secondary`, or `toolbar`.
 * If no type is provided, the default styling will be used.
 * @prop {string} value Defines the number displayed inside the badge.
 * @cssprop [--ot-badge-background-color=#FFFFFF] The custom background color of the badge.
 * @cssprop [--ot-badge-color=#2E3D98] The custom text color of the badge.
 */
class OtcBadge extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      styleSheet,
    ];
  }

  static get properties() {
    return {
      isActive: {
        type: Boolean,
        reflect: true,
      },
      forToolbar: {
        type: Boolean,
        reflect: true,
      },
      secondary: {
        type: Boolean,
        reflect: true,
      },
      type: {
        type: String,
        reflect: true,
      },
      value: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.isActive = false;
    this.forToolbar = false;
    this.secondary = false;
    this.type = '';
    this.value = null;
  }

  firstUpdated() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  render() {
    const badgeClasses = {
      'ot-badge': true,
      'ot-badge--is-active': this.isActive,
      'ot-badge--is-notification': this.type === 'notification',
      'ot-badge--is-secondary': this.type === 'secondary' || this.secondary,
      'ot-badge--is-toolbar': this.type === 'toolbar' || this.forToolbar,
      'ot--is-hidden': !this.value,
    };

    return html`<span class="${e(badgeClasses)}">${this.value}</span>`;
  }
}

customElements.define('otc-badge', OtcBadge);

export { OtcBadge };
//# sourceMappingURL=otcBadge.js.map
