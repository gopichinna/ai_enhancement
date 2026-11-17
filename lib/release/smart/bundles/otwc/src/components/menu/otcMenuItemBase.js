import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import otcMenuItemBaseStyles from './otcMenuItemBase.scss.js';

/**
 * @prop {string} ariaLabel The aria-label of the menu item.
 * @prop {boolean} _showAnimation Indicates that the menu item should apply its fade-in animation.
 */
class OtcMenuItemBase extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      otcMenuItemBaseStyles,
    ];
  }

  static get properties() {
    return {
      ariaLabel: { type: String, reflect: true },
      _showAnimation: { type: Boolean },
    };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this._showAnimation = false;
  }

  /** @internal */
  get baseClasses() {
    return {
      'otc-dropdown__item--fade-in-anim': this._showAnimation,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }
}

export { OtcMenuItemBase };
//# sourceMappingURL=otcMenuItemBase.js.map
