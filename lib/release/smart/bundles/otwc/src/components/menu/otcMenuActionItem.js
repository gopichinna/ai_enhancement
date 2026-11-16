import { css, html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

class OtcMenuActionItem extends OtcMenuItemBase {
  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      css`:host{pointer-events:none}`,
    ];
  }

  render() {
    const dropdownItemClasses = {
      'ot-dropdown__action-item': true,
      ...this.baseClasses,
    };

    return html`<li id="menuactionitem-dropdownitem" class="${e(dropdownItemClasses)}" role="menuitem" tabindex="-1"><slot></slot></li>`;
  }
}

customElements.define('otc-menuactionitem', OtcMenuActionItem);

export { OtcMenuActionItem };
//# sourceMappingURL=otcMenuActionItem.js.map
