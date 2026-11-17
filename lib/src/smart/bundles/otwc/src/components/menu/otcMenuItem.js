/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { actionCloseExtraSmall } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { ThemeController } from '../../controllers/themeController.js';
import menuItemStylesheet from './otcMenuItem.scss.js';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { shouldRenderIcon, getClassesForIcon, getSVGForIconWithOptions } from '../../utilities/render-utilities.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Item component represents a dropdown menu item.
 * @prop {string} deletableIconTitle The title of the deletable icon, used for a tooltip.
 * @prop {boolean} disabled The disabled state of the menu item.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.<br>**DEPRECATED:** Use an `otc-icon`
 * element alongside the text.
 * @prop {boolean} isDeletable A flag indicating that the menu item should remove itself from the menu on activation.
 * @prop {boolean} menuOpen A flag indicating that this is the parent of a submenu and the submenu dropdown is currently open.
 * @prop {boolean} isSubmenu A flag indicating that this is the parent of a submenu and will have the relevant ARIA attributes applied.
 * @slot unnamed Defines the text/icons displayed in the menu item.
 */
class OtcMenuItem extends OtcMenuItemBase {
  #themeController = new ThemeController(this);

  #partRefs = {
    deletableIcon: e(),
    dropdownItem: e(),
    slot: e(),
  };

  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      menuItemStylesheet,
      iconStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      deletableIconTitle: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      icon: { type: String, reflect: true },
      isDeletable: { type: Boolean, reflect: true },
      isSubmenu: { type: Boolean, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
    };

    return { ...ThemeController.properties, ...OtcMenuItemBase.properties, ...props };
  }

  constructor() {
    super();

    this.deletableIconTitle = '';
    this.disabled = false;
    this.icon = '';
    this.isDeletable = false;
    this.isSubmenu = false;
    this.menuOpen = false;

    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
  }

  #handleClick(event) {
    if (this.isDeletable && event.composedPath().includes(this.#partRefs.deletableIcon.value)) {
      this.#dispatchItemRemoveEvent();
      // Stop the menu from closing when clicking on a deletable item.
      event.stopPropagation();
    } else {
      this.#dispatchItemClickEvent();
    }
  }

  #handleKeyDown(event) {
    switch (event.key) {
      case 'Backspace':
      case 'Delete':
        if (this.isDeletable) {
          this.#dispatchItemRemoveEvent();
          // Stop the menu from closing when clicking on a deletable item.
          event.stopPropagation();
        }
        break;

      case 'Enter':
      case 'Spacebar':
      case ' ':
        this.#dispatchItemClickEvent();

        // Prevent the default action, otherwise Spacebar will also scroll the page.
        event.preventDefault();
        break;

      // no default
    }
  }

  focus() {
    this.#partRefs.dropdownItem.value?.focus();
  }

  #dispatchItemClickEvent() {
    this.dispatchEvent(new CustomEvent('item-click', { bubbles: true }));
    this.dispatchEvent(new CustomEvent('itemClick', { bubbles: true })); // #3599171
  }

  #dispatchItemRemoveEvent() {
    this.dispatchEvent(new CustomEvent('item-remove', { bubbles: true }));
    this.dispatchEvent(new CustomEvent('itemRemove', { bubbles: true })); // #3599171
  }

  /**
   * Returns an array of elements assigned to the default slot of this component.
   *
   * @returns {Element[]}
   * @internal
   */
  get #slottedElements() {
    return this.#partRefs.slot.value?.assignedElements({ flatten: true });
  }

  #getIconHTML(icon) {
    if (shouldRenderIcon(this)) {
      const dropDownIconClasses = {
        'ot-dropdown__icon': true,
      };
      Object.assign(dropDownIconClasses, getClassesForIcon(this));
      return html`<div class="${e$1(dropDownIconClasses)} ot-dropdown__icon">${getSVGForIconWithOptions(
        { iconKey: icon },
        { role: 'presentation' },
      )}</div>`;
    }
    return html``;
  }

  #handleSlotChange() {
    // We apply a class if there is a slotted smart icon, so we need to update the component to ensure the class is applied.
    this.requestUpdate();
  }

  #getNormalTemplate() {
    return html`<slot ${n(this.#partRefs.slot)} @slotchange="${this.#handleSlotChange}"></slot>`;
  }

  #getDeletableTemplate() {
    return html`<span class="ot-dropdown__item--deletable-text"><slot></slot></span><span class="ot-dropdown__item--deletable-icon" ${n(this.#partRefs.deletableIcon)}><otc-icon isPresentation size="${this._themeIsCarbonFiber ? '24px' : '16px'}" svg="${actionCloseExtraSmall}" title="${this.deletableIconTitle.length > 0 ? this.deletableIconTitle : nothing}"></otc-icon></span>`;
  }

  render() {
    const dropdownItemClasses = {
      'ot-dropdown__item': true,
      'ot-dropdown__item--is-deletable': this.isDeletable,
      'ot-dropdown__item--has-slotted-smart-icon': this.#slottedElements?.some(el => el.matches('otc-icon[icon]:not([icon=""])')),
      ...this.baseClasses,
    };

    let ariaExpandedValue = nothing;
    if (this.isSubmenu) {
      if (this.menuOpen) {
        ariaExpandedValue = 'true';
      } else {
        ariaExpandedValue = 'false';
      }
    }

    return html`<li ${n(this.#partRefs.dropdownItem)} id="menuitem-dropdownitem" class="${e$1(dropdownItemClasses)}" ?disabled="${this.disabled}" role="menuitem" tabindex="-1" aria-expanded="${ariaExpandedValue}" aria-haspopup="${this.isSubmenu ?? nothing}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}">${this.#getIconHTML(this.icon)} ${this.isDeletable ? this.#getDeletableTemplate() : this.#getNormalTemplate()}</li>`;
  }
}

customElements.define('otc-menuitem', OtcMenuItem);

export { OtcMenuItem };
//# sourceMappingURL=otcMenuItem.js.map
