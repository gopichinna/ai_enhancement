import { html, nothing } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Group component represents a dropdown menu group.
 * @prop {boolean} allowDeselection Indicates that the menu group should allow deselection of any `otc-menuradio` elements that it contains.
 * @prop {string} name The text of the menu group label.
 * @slot unnamed Defines the content of the menu group.
 * **Note:** It is strongly recommended that you only use `otc-menucheckbox`, `otc-menudivider`, `otc-menuitem`, `otc-menuradio`, or
 * `otc-submenu` components in order to preserve the intended design.
 */
class OtcMenuGroup extends OtcMenuItemBase {
  // Used internally to access elements in the shadow root.
  #partRefs = {
    slot: e(),
  };

  static get properties() {
    return {
      ...OtcMenuItemBase.properties,
      allowDeselection: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
    };
  }

  constructor() {
    super();

    this.allowDeselection = false;
    this.name = '';
  }

  updated(changedProperties) {
    if (changedProperties.has('menuOpen')) {
      const slottedElements = this.#slottedElements;

      if (this.menuOpen) {
        // Add the `menuOpen` property to each of our slotted elements.
        slottedElements?.forEach((item) => {
          item.updateComplete?.then(() => { item.menuOpen = true; });
        });
      } else {
        // Remove the `menuOpen` property from each of our slotted elements.
        slottedElements?.forEach((item) => {
          item.updateComplete?.then(() => { item.menuOpen = false; });
        });
      }
    }
  }

  get #slottedElements() {
    return this.#partRefs.slot.value?.assignedElements({ flatten: true });
  }

  #getLabelTemplate() {
    if (this.name?.length > 0) {
      const dropdownItemClasses = {
        'ot-dropdown__label': true,
        'ot-flex': true,
        ...this.baseClasses,
      };

      return html`<div id="menu-group-label" class="${e$1(dropdownItemClasses)}" role="none">${this.name}</div>`;
    }

    return nothing;
  }

  render() {
    return html`${this.#getLabelTemplate()}<div id="menu-group-div" class="ot-dropdown__label-group" role="group" aria-labelledby="${this.name?.length > 0 ? 'menu-group-label' : nothing}"><slot ${n(this.#partRefs.slot)}></slot></div>`;
  }
}

customElements.define('otc-menugroup', OtcMenuGroup);

export { OtcMenuGroup };
//# sourceMappingURL=otcMenuGroup.js.map
