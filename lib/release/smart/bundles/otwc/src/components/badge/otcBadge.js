import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcBadge.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Badge component is a small round element containing text, usually used to indicate the count of an associated element.
 * @prop {boolean} disabled Indicates that the badge is disabled (e.g. if part of a disabled button) and should change its styling.
 * @prop {boolean} isActive Indicates that the badge is active (e.g. part of a button being clicked) and should change its styling.
 * <br>**DEPRECATED: ** The default active style is applied automatically as needed.
 * @prop {string} type Indicates the type of badge for styling purposes: `notification`, `secondary`, or `toolbar`.
 * If no type is provided, the default styling will be used.
 * @prop {string} size Defines the size of the badge.  Not applicable to legacy themes.
 * @prop {string} value Defines the number displayed inside the badge.  When using a JATO theme, a missing or blank value will display a
 * red dot indicator.
 * @cssprop [--ot-badge-background-color=#FFFFFF] The custom background color of the badge.
 * @cssprop [--ot-badge-color=#2E3D98] The custom text color of the badge.
 */
class OtcBadge extends ElementBase {
  #themeController = new ThemeController(this);

  static get styles() {
    return [
      commonStyleSheet,
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      disabled: {
        type: Boolean,
        reflect: true,
      },
      isActive: {
        type: Boolean,
        reflect: true,
      },
      type: {
        type: String,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
      value: {
        type: String,
        reflect: true,
      },
    };
    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.disabled = false;
    this.isActive = false;
    this.type = '';
    this.size = 'regular';
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
      'ot--is-hidden': (this._themeIsCarbonFiber && !this.value),
      'ot-badge-jato--is-small': !this._themeIsCarbonFiber && this.size === 'small',
      'ot-badge-jato--is-large': !this._themeIsCarbonFiber && this.size === 'large',
    };

    return html`<div class="ot-badge--wrapper"><span class="${e(badgeClasses)}">${this.value}</span></div>`;
  }
}

customElements.define('otc-badge', OtcBadge);

export { OtcBadge };
//# sourceMappingURL=otcBadge.js.map
