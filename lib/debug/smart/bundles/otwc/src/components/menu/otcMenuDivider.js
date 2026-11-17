import { html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import otcMenuDividerStyles from './otcMenuDivider.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

class OtcMenuDivider extends OtcMenuItemBase {
  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      otcMenuDividerStyles,
    ];
  }

  render() {
    const dropdownItemClasses = {
      'ot-dropdown__divider': true,
      ...this.baseClasses,
    };

    return html`<li class="${e(dropdownItemClasses)}" role="none"></li>`;
  }
}

customElements.define('otc-menudivider', OtcMenuDivider);

export { OtcMenuDivider };
//# sourceMappingURL=otcMenuDivider.js.map
