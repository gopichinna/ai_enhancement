import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import dropDownStyleSheet from '../../styles/dropdown.scss.js';
import styleSheet from '../radio/otcRadio.scss.js';
import checkboxStyleSheet from '../checkbox/otcCheckbox.scss.js';
import otcMenuItemBaseStyles from './otcMenuItemBase.scss.js';

/**
 * @prop {boolean} _showAnimation Indicates that the menu item should apply its fade-in animation.
 */
class OtcMenuItemBase extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      styleSheet,
      checkboxStyleSheet,
      dropDownStyleSheet,
      otcMenuItemBaseStyles,
    ];
  }

  static get properties() {
    return {
      _showAnimation: { type: Boolean },
    };
  }

  constructor() {
    super();

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
