import { nothing, html } from 'lit';
import { OtcSelectItem } from '../otcSelectItem.js';
import selectExtensibleItemStyleSheet from './otcSelectExtensibleItem.scss.js';
import { classMap as e } from '../../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Select Extensible Item is an extension for the Select Item component and can be used in `otc-select` component.
 * The difference is that the select item extend component can take the content of the slot as display.
 * And so the user has more flexibility to design the item.
 *
 * @slot unnamed The content of the item.
 */
class OtcSelectExtensibleItem extends OtcSelectItem {
  static get styles() {
    return [
      OtcSelectItem.styles,
      selectExtensibleItemStyleSheet,
    ];
  }

  render() {
    const dropdownItemClasses = {
      'ot-select-extensible-item': true,
      'ot-dropdown__item': true,
      'ot-dropdown__item--is-selected': this.selected,
    };

    return html`<div id="selectitem-dropdownitem" class="${e(dropdownItemClasses)}" ?selected="${this.selected}" .value="${this.value}" role="option" tabindex="-1" aria-label="${this.ariaLabel || nothing}" aria-selected="${this.selected}"><slot></slot></div>`;
  }
}

if (!customElements.get('otc-selectextensibleitem')) {
  customElements.define('otc-selectextensibleitem', OtcSelectExtensibleItem);
}

export { OtcSelectExtensibleItem };
//# sourceMappingURL=otcSelectExtensibleItem.js.map
