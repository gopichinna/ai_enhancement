/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { ThemeController } from '../../controllers/themeController.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import buttonJatoStyleSheet from '../button/otcButtonJato.scss.js';
import menuActionItemStyleSheet from './otcMenuActionItem.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

class OtcMenuActionItem extends OtcMenuItemBase {
  #themeController = new ThemeController(this);

  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      buttonStyleSheet,
      buttonJatoStyleSheet,
      menuActionItemStyleSheet,
    ];
  }

  static get properties() {
    const props = { };

    return { ...ThemeController.properties, ...props };
  }

  render() {
    const dropdownItemClasses = {
      'ot-btn': this._themeIsCarbonFiber,
      'ot-btn--is-mini': this._themeIsCarbonFiber,
      'ot-btn--is-secondary': this._themeIsCarbonFiber,
      'ot-btn-jato': !this._themeIsCarbonFiber,
      'ot-btn-jato--is-more': !this._themeIsCarbonFiber,
      ...this.baseClasses,
    };

    return html`<div class="ot-dropdown__action-item" role="none"><li id="menuactionitem-dropdownitem" class="${e(dropdownItemClasses)}" role="menuitem" tabindex="-1" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}"><slot></slot></li></div>`;
  }
}

customElements.define('otc-menuactionitem', OtcMenuActionItem);

export { OtcMenuActionItem };
//# sourceMappingURL=otcMenuActionItem.js.map
