/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

class OtcMenuDivider extends OtcMenuItemBase {
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
