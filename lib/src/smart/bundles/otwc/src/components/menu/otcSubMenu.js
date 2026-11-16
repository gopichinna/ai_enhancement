/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import otcSubMenuStyles from './otcSubMenu.scss.js';
import { isChild } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { OTC_ICON_BUNDLE_WC_ACTION_16 } from '../../utilities/render-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';

/* eslint-disable lit-a11y/list */

const actionCaretRight16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_right16`;
const actionCaretLeft16 = `${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_left16`;

/**
 * The Submenu component represents a dropdown submenu.
 * @prop {boolean} isOpen The open state of submenu.
 * @prop {string} name The text of the submenu item.
 * @slot unnamed Defines the content of the submenu.
 * **Note:** It is strongly recommended that you only use `otc-menucheckbox`, `otc-menudivider`, `otc-menuitem`, `otc-menugroup`,
 * `otc-menuradio`, or `otc-submenu` components in order to preserve the intended design.
 */
class OtcSubMenu extends OtcMenuItemBase {
  #rtlController = new RTLController(this);

  #partRefs = {
    dropdownItem: e(),
    menuSlot: e(),
  };

  static get styles() {
    return [
      ...OtcMenuItemBase.styles,
      otcSubMenuStyles,
    ];
  }

  static get properties() {
    return {
      ...OtcMenuItemBase.properties,
      isOpen: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
    };
  }

  constructor() {
    super();

    this.addEventListener('click', this._handleClick);
    this.addEventListener('mouseenter', this._handleMouseEnter);
    this.addEventListener('mouseleave', this._handleMouseLeave);
    this.addEventListener('keydown', this._handleKeyDown);
    this.addEventListener('focusout', this._handleFocusOut);

    this.isOpen = false;
    this.name = '';
  }

  updated(changedProperties) {
    if (changedProperties.has('isOpen') && this.isOpen) {
      // Focus on the first element in the menu, unless we opened the submenu through hover.
      // If we opened the submenu through hover, then the focus-visible style might be applied, which we don't want.
      if (!this.mouseEnterID) {
        FocusUtilities.focusFirstItem(this.#slottedElements);
      }
    }
  }

  get #slottedElements() {
    return this.#partRefs.menuSlot.value?.assignedElements({ flatten: true });
  }

  _handleClick(event) {
    if ((event.target === this)
        || (event.target.tagName === 'OTC-MENUITEM')
        || (event.target.tagName === 'OTC-TOOLBARITEM')) {
      if (this.isOpen) {
        this.isOpen = false;
      } else {
        // Prevent the mouse enter event from opening the submenu.
        clearTimeout(this.mouseEnterID);
        this.mouseEnterID = null;

        this.isOpen = true;
      }

      // Prevent the click handler in the parent menu from processing this same event.
      // This is necessary with nested submenus, so that the parent click handler does not immediately close the menu.
      if (event.target.tagName === 'OTC-SUBMENU') {
        event.stopPropagation();
      }
    }
  }

  _handleKeyDown(event) {
    // Close the submenu on Escape or Left, except when the target is this.
    if (((event.key === 'Escape') || (event.key === 'Esc')
          || ((event.key === 'ArrowLeft') && !this.#rtlController.isRTL)
          || ((event.key === 'ArrowRight') && this.#rtlController.isRTL)) && (this !== event.target)) {
      this.isOpen = false;

      // Focus on the dropdown item part of the submenu.
      this.#partRefs.dropdownItem.value?.focus();

      // Prevent the keydown handler in the main menu from processing this same event.
      event.stopPropagation();
    }

    // The click event is not fired through keyboard activation.  We need to trigger it manually.
    if ((event.key === 'Enter') || (event.key === 'Spacebar') || (event.key === ' ')) {
      this._handleClick(event);

      // Prevent the default action, otherwise Spacebar will also scroll the submenu after it is displayed.
      event.preventDefault();
    }

    // Right on a submenu (or left in RTL) should open the submenu.
    if ((event.target.tagName === 'OTC-SUBMENU')
          && (((event.key === 'ArrowRight') && !this.#rtlController.isRTL)
            || ((event.key === 'ArrowLeft') && this.#rtlController.isRTL))) {
      this._handleClick(event);
    }
  }

  _handleMouseEnter() {
    // Prevent the mouse leave event from closing the submenu, if it hasn't already.
    if (this.mouseLeaveID) {
      clearTimeout(this.mouseLeaveID);
      this.mouseLeaveID = null;
    }

    // Set the submenu to be opened 300ms after mouse enter.
    this.mouseEnterID = setTimeout(() => {
      this.isOpen = true;
    }, 300);
  }

  _handleMouseLeave() {
    if (this.mouseEnterID) {
      // Prevent the mouse enter event from opening the submenu, if it hasn't already.
      clearTimeout(this.mouseEnterID);
      this.mouseEnterID = null;
    }

    // Set the submenu to be closed 300ms after mouse leave.
    this.mouseLeaveID = setTimeout(() => {
      this.isOpen = false;
    }, 300);
  }

  _handleFocusOut(event) {
    // Close the submenu when we lose focus to an element that is not a child menu item.
    if (!event.relatedTarget || !isChild(this, event.relatedTarget)) {
      this.isOpen = false;
    }
  }

  #getMenuItemTemplate() {
    return html`<otc-menuitem ${n(this.#partRefs.dropdownItem)} id="submenu-dropdownitem" isSubmenu ?_showAnimation="${this._showAnimation}"><span class="ot-submenu--wrapper" role="none">${this.name}<otc-icon icon="${this.#rtlController.isRTL ? actionCaretLeft16 : actionCaretRight16}" disableEffects isPresentation></otc-icon></span></otc-menuitem>`;
  }

  #getMenuTemplate() {
    return html`<otc-menu buttonId="submenu-dropdownitem" ?isOpen="${this.isOpen}" isSubmenu><slot ${n(this.#partRefs.menuSlot)}></slot></otc-menu>`;
  }

  render() {
    return html`${this.#getMenuItemTemplate()} ${this.#getMenuTemplate()}`;
  }
}

customElements.define('otc-submenu', OtcSubMenu);

export { OtcSubMenu };
//# sourceMappingURL=otcSubMenu.js.map
