/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { LitElement, html, nothing } from 'lit';
import { ElementBase } from '../element-base.js';
import { OTC_ICON_BUNDLE_WC_ACTION_16 } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import toolbarItemStyles from './otcToolbarItem.scss.js';

/**
 * The Toolbar Item component can be used inside an `otc-toolbar` as a text button, an icon button, a menu item, or a submenu, depending on
 * context.  When placed directly inside an `otc-toolbar`, it will be rendered as an `otc-button`.  If this Toolbar Item contains children,
 * then an `otc-menu` will be created automatically and associated with this `otc-button`.  Toolbar Items that are the child of another
 * Toolbar Item will be rendered as an `otc-menuitem`, so that they are properly displayed in the aforementioned `otc-menu`.  If this
 * Toolbar Item also contains children, then it will instead be rendered as an `otc-submenu`.
 * @prop {string} ariaLabel Defines the aria label associated with the toolbar item when it is an icon.
 * @prop {string} buttonSize The size of button.
 * @prop {string} buttonType The type of button.
 * @prop {boolean} headerItem Indicates that the button is part of a Header Bar.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. header:header_user42
 * @prop {string} iconAppearance Specifies the icon appearance (theme) of the button.
 * @prop {string} value The text of the toolbar item.
 * @slot unnamed Defines the children of this toolbar item, which will be wrapped in an `otc-menu`.
 */
class OtcToolbarItem extends ElementBase {
  #overflowSlotName = 'otc-overflow-slot';

  #internalElementId = 'toolbaritem-element';

  #mutationObserver = new MutationObserver(this.#handleMutation.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      toolbarItemStyles,
    ];
  }

  static get properties() {
    return {
      ariaLabel: { type: String, reflect: true },
      buttonSize: { type: String, reflect: true },
      buttonType: { type: String, reflect: true },
      headerItem: { type: Boolean, reflect: true },
      icon: { type: String, reflect: true },
      iconAppearance: { type: String, reflect: true },
      value: { type: String, reflect: true },
    };
  }

  static get shadowRootOptions() {
    return {
      ...LitElement.shadowRootOptions,
      // If the user clicks somewhere to the shadow DOM, focus the inner
      // interactive element and enable CSS pseudo-classes detecting the focused
      // state on the host element too.
      delegatesFocus: true,
    };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.buttonSize = '';
    this.buttonType = 'inline';
    this.headerItem = false;
    this.icon = '';
    this.iconAppearance = '';
    this.value = '';
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }

    // Observe changes to our `slot` attribute and child nodes.
    this.#mutationObserver.observe(this, { attributes: true, attributeFilter: ['slot'], childList: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#mutationObserver.disconnect();
  }

  #handleMutation() {
    this.requestUpdate();
  }

  #getMenuItemTemplate() {
    return html`<otc-menuitem id="${this.#internalElementId}">${this.value}</otc-menuitem>`;
  }

  #getSubmenuTemplate() {
    return html`<otc-submenu id="${this.#internalElementId}" name="${this.value}"><slot></slot></otc-submenu>`;
  }

  #getIconButtonTemplate() {
    return html`<otc-button ariaLabel="${this.ariaLabel.length > 0 ? this.ariaLabel : this.value}" ?headerItem="${this.headerItem}" icon="${this.icon}" iconAppearance="${this.iconAppearance}" id="${this.#internalElementId}"><slot name="count"></slot></otc-button>${(this.children.length > 0 && this.children[0].tagName !== 'OTC-BADGE') ? this.#getMenuTemplate() : nothing}`;
  }

  #getTextButtonTemplate() {
    return html`<div class="ot-toolbar-item-wrapper"><otc-button ariaLabel="${this.ariaLabel.length > 0 ? this.ariaLabel : this.value}" id="${this.#internalElementId}" size="${this.buttonSize ? this.buttonSize : nothing}" type="${this.buttonType}">${this.value} ${(this.children.length > 0) ? this.#getMenuCaretIconTemplate() : nothing}</otc-button>${this.children.length > 0 ? this.#getMenuTemplate() : nothing}</div>`;
  }

  #getMenuTemplate() {
    return html`<otc-menu buttonId="${this.#internalElementId}"><slot></slot></otc-menu>`;
  }

  #getMenuCaretIconTemplate() {
    return html`<otc-icon icon="${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_down16" isPresentation></otc-icon>`;
  }

  render() {
    // If we are in the toolbar overflow slot or are a child of another toolbar item, then we should render as a menu item.
    if ((this.slot === this.#overflowSlotName) || (this.parentElement?.tagName === 'OTC-TOOLBARITEM')) {
      // If we should render as a menu item, but we have toolbar item children of our own, then we should render as a submenu.
      if (Array.from(this.children).some(child => child.tagName === 'OTC-TOOLBARITEM')) {
        return this.#getSubmenuTemplate();
      }

      return this.#getMenuItemTemplate();
    }

    // If the icon property is set, we should render as an icon only button.
    if (this.icon) {
      return this.#getIconButtonTemplate();
    }

    // If no other scenarios are true, we should render as a text button.
    return this.#getTextButtonTemplate();
  }
}

customElements.define('otc-toolbaritem', OtcToolbarItem);

export { OtcToolbarItem };
//# sourceMappingURL=otcToolbarItem.js.map
