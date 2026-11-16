import { html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

class OtcMenuLabel extends OtcMenuItemBase {
  render() {
    const dropdownItemClasses = {
      'ot-dropdown__label': true,
      ...this.baseClasses,
    };

    return html`<li class="${e(dropdownItemClasses)}" role="menuitem"><slot></slot></li>`;
  }
}

customElements.define('otc-menulabel', OtcMenuLabel);

export { OtcMenuLabel };
//# sourceMappingURL=otcMenuLabel.js.map
