import { ElementBase } from '../element-base.js';
import widgetHeaderTitleStyles from './otcWidgetHeaderTitle.scss.js';

/**
 * The Widget Header Title Base contains the aspects common to all Widget Header Title types.
 * @prop {string} titleText Defines the text displayed in the center of the title.
 */
class OtcWidgetHeaderTitleBase extends ElementBase {
  static get styles() {
    return [
      widgetHeaderTitleStyles,
    ];
  }

  static get properties() {
    return {
      titleText: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.titleText = '';
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }
}

export { OtcWidgetHeaderTitleBase };
//# sourceMappingURL=otcWidgetHeaderTitleBase.js.map
