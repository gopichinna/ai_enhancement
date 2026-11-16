import { html, nothing } from 'lit';
import menuItemStylesheet from './otcMenuItem.scss.js';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { shouldRenderIcon, getClassesForIcon, getSVGForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Item component represents a dropdown menu item.
 * @prop {boolean} disabled The disabled state of the menu item.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {boolean} isDeletable A flag indicating that the menu item should remove itself from the menu on activation.
 * @prop {boolean} menuOpen A flag indicating that this is the parent of a submenu and the submenu dropdown is currently open.
 * @prop {boolean} isSubmenu A flag indicating that this is the parent of a submenu and will have the relevant ARIA attributes applied.
 * @slot unnamed Defines the text/icons displayed in the menu item.
 */
class OtcMenuItem extends OtcMenuItemBase {
  static get styles() {
    return [
      menuItemStylesheet,
      ...OtcMenuItemBase.styles,
    ];
  }

  static get properties() {
    const props = {
      ...OtcMenuItemBase.properties,
      disabled: { type: Boolean, reflect: true },
      icon: { type: String, reflect: true },
      isDeletable: { type: Boolean, reflect: true },
      isSubmenu: { type: Boolean, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
    };

    return props;
  }

  constructor() {
    super();

    this.disabled = false;
    this.icon = '';
    this.isDeletable = false;
    this.isSubmenu = false;
    this.menuOpen = false;

    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  _handleClick(event) {
    if (this.isDeletable) {
      // Stop the menu from closing when clicking on a deletable item.
      event.stopPropagation();
    } else {
      this.#dispatchItemClickEvent();
    }
  }

  _handleKeyDown(event) {
    switch (event.key) {
      case 'Delete':
        if (this.isDeletable) {
          this._handleDeletableKeyDown(event);
          // Stop the menu from closing when clicking on a deletable item.
          event.stopPropagation();
        }
        break;

      case 'Enter':
      case 'Spacebar':
      case ' ':
        if (this.isDeletable) {
          this._handleDeletableKeyDown(event);
          // Stop the menu from closing when clicking on a deletable item.
          event.stopPropagation();
        } else {
          this._handleClick();
        }

        // Prevent the default action, otherwise Spacebar will also scroll the page.
        event.preventDefault();
        break;

      // no default
    }
  }

  focus() {
    const dropdownItem = this._dropdownItem;
    if (dropdownItem) {
      dropdownItem.focus();
    }
  }

  _handleDeletableClick() {
    if (this.isDeletable) {
      this.#dispatchItemRemoveEvent();
    }
  }

  _handleDeletableKeyDown(event) {
    if (this.isDeletable) {
      switch (event.key) {
        case 'Delete':
        case 'Enter':
        case 'Spacebar':
        case ' ':
          this.#dispatchItemRemoveEvent();
          break;
        // no default
      }
    }
  }

  #dispatchItemClickEvent() {
    this.dispatchEvent(new CustomEvent('item-click', {
      bubbles: true,
    }));
  }

  #dispatchItemRemoveEvent() {
    this.dispatchEvent(new CustomEvent('item-remove', {
      bubbles: true,
    }));
  }

  #getIconHTML(icon) {
    if (shouldRenderIcon(this)) {
      const dropDownIconClasses = {
        'ot-dropdown__icon': true,
      };
      Object.assign(dropDownIconClasses, getClassesForIcon(this));
      return html`<div class="${e(dropDownIconClasses)} ot-dropdown__icon">${getSVGForIcon(icon, null)}</div>`;
    }
    return html``;
  }

  get _dropdownItem() {
    if (this.shadowRoot) {
      return this.shadowRoot.getElementById('menuitem-dropdownitem');
    }

    return null;
  }

  #getNormalTemplate() {
    return html`<slot></slot>`;
  }

  #getDeletableTemplate() {
    return html`<span class="ot-dropdown__item--deletable-text"><slot></slot></span><span class="ot-dropdown__item--deletable-icon" @click="${this._handleDeletableClick}" @keydown="${this._handleDeletableKeyDown}"></span>`;
  }

  render() {
    const dropdownItemClasses = {
      'ot-dropdown__item': true,
      'ot-dropdown__item--is-deletable': this.isDeletable,
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

    return html`<li id="menuitem-dropdownitem" class="${e(dropdownItemClasses)}" ?disabled="${this.disabled}" role="menuitem" tabindex="-1" aria-expanded="${ariaExpandedValue}" aria-haspopup="${this.isSubmenu ?? nothing}">${this.#getIconHTML(this.icon)} ${this.isDeletable ? this.#getDeletableTemplate() : this.#getNormalTemplate()}</li>`;
  }
}

customElements.define('otc-menuitem', OtcMenuItem);

export { OtcMenuItem };
//# sourceMappingURL=otcMenuItem.js.map
