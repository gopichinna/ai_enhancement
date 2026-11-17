import { LitElement, html, nothing } from 'lit';
import { ElementBase } from '../element-base.js';
import { triggerEvent } from '../../utilities/common-utilities.js';
import { OTC_ICON_BUNDLE_WC_ACTION_16 } from '../../utilities/render-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import toolbarItemStyles from './otcToolbarItem.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';

/**
 * The Toolbar Item component can be used inside an `otc-toolbar` as a text button, an icon button, a menu item, or a submenu, depending on
 * context.  When placed directly inside an `otc-toolbar`, it will be rendered as an `otc-button`.  If this Toolbar Item contains children,
 * then an `otc-menu` will be created automatically and associated with this `otc-button`.  Toolbar Items that are the child of another
 * Toolbar Item will be rendered as an `otc-menuitem`, so that they are properly displayed in the aforementioned `otc-menu`.  If this
 * Toolbar Item also contains children, then it will instead be rendered as an `otc-submenu`.
 * @prop {string} ariaLabel Defines the aria label associated with the toolbar item when it is an icon.
 * @prop {string} ariaExpanded Defines the value of the aria-expanded attribute of the internal otc-button, if this item opens a
 * custom element. Do not use this attribute with an otc-menu.
 * @prop {boolean} clearAll Determines whether or not to show the "Clear all" menu action item will be displayed in the dropdown menu
 * containing the toolbar item's children.
 * @prop {boolean} disabled Indicates that the toolbar item is disabled.
 * @prop {boolean} headerItem *Deprecated* Indicates that the button is part of a Header Bar.
 * @prop {string} icon *Deprecated, use svg instead* A string containing the icon bundle and icon name, e.g. header:header_user42
 * @prop {string} iconAppearance *Deprecated* Specifies the icon appearance (theme) of the button.
 * @prop {boolean} menuOpen Indicates that the toolbar item is associated with a menu that is currently open.
 * @prop {boolean} toggled Indicates that the toolbar item is in toggled state.
 * @prop {boolean} scrollable Determines if the menu dropdown should be limited to the height of the viewport with an added scrollbar.
 * @prop {string} size The size of the button. Possible values are `small, regular, large`. If not specified, the default is 'regular'.
 * @prop {string} svg The `svg` markup.
 * @prop {boolean} usePopover Uses the Popover API to display the menu.
 * @prop {string} value The text of the toolbar item.
 * @slot badge Defines an `otc-badge` element that should be placed beside the `value` text when rendered as a button.
 * @slot count Defines an `otc-badge` that will be overlaid onto the button icon.
 * @slot unnamed Defines the children of this toolbar item, which will be wrapped in an `otc-menu`.
 */
class OtcToolbarItem extends ElementBase {
  #themeController = new ThemeController(this);

  #overflowSlotName = 'otc-overflow-slot';

  #internalElementId = 'toolbaritem-element';

  #mutationObserver = new MutationObserver(this.#handleMutation.bind(this));

  #menuOpenMutationObserver = new MutationObserver(this.#handleMenuOpenMutation.bind(this));

  #partRefs = {
    menu: e(),
    submenu: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      toolbarItemStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
      ariaExpanded: { type: String, reflect: true },
      clearAll: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      headerItem: { type: Boolean, reflect: true },
      icon: { type: String, reflect: true },
      iconAppearance: { type: String, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
      toggled: { type: Boolean, reflect: true },
      scrollable: { type: Boolean, reflect: true },
      size: { type: String, reflect: true },
      svg: { type: String, reflect: true },
      usePopover: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
    };
    return { ...ThemeController.properties, ...props };
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
    this.ariaExpanded = '';
    this.clearAll = false;
    this.disabled = false;
    this.headerItem = false;
    this.icon = '';
    this.iconAppearance = '';
    this.menuOpen = false;
    this.toggled = false;
    this.scrollable = false;
    this.size = 'regular';
    this.svg = '';
    this.usePopover = false;
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

  updated(changedProperties) {
    if (changedProperties.has('disabled')) {
      // Set the disables property on all elements in the badge slot.
      this.#getBadgeSlotElements().forEach((element) => {
        element.disabled = this.disabled;
      });
    }

    // Observe changes to the `isOpen` attribute of the menu and submenu.
    if (this.#partRefs.menu.value || this.#partRefs.submenu.value) {
      this.#menuOpenMutationObserver.disconnect();

      if (this.#partRefs.menu.value) {
        this.#menuOpenMutationObserver.observe(this.#partRefs.menu.value, { attributes: true, attributeFilter: ['isopen'] });
      }

      if (this.#partRefs.submenu.value) {
        this.#menuOpenMutationObserver.observe(this.#partRefs.submenu.value, { attributes: true, attributeFilter: ['isopen'] });
      }
    }
  }

  #handleMutation() {
    this.requestUpdate();
  }

  #handleMenuOpenMutation(mutationList) {
    mutationList.forEach((mutation) => {
      this.menuOpen = mutation.target.isOpen;
    });
  }

  #handleClearAll() {
    // The `clearAll` event comes from the "Clear all" button of the `otc-menu`.  Since the "Clear all" button only exists in the shadow DOM
    // of the `otc-menu`, it will not bubble further.  We need to re-trigger a `clearAll` event on this toolbar item.
    triggerEvent(this, CustomEvent, 'clear-all');
    triggerEvent(this, CustomEvent, 'clearAll'); // #3599171
  }

  #getBadgeSlotElements() {
    return Array.from(this.querySelectorAll('*[slot="badge"]'));
  }

  #hasBadgeSlotElements() {
    return this.#getBadgeSlotElements().length > 0;
  }

  #getMenuItemTemplate() {
    return html`<otc-menuitem ?disabled="${this.disabled}" id="${this.#internalElementId}">${this.value.length > 0 ? this.value : this.title}</otc-menuitem>`;
  }

  #getSubmenuTemplate() {
    return html`<otc-submenu ${n(this.#partRefs.submenu)} id="${this.#internalElementId}" ?isOpen="${this.menuOpen}" name="${this.value}"><slot></slot></otc-submenu>`;
  }

  #getIconButtonTemplate() {
    if (this._themeIsCarbonFiber) {
      return html`<otc-button ariaLabel="${(this.ariaLabel.length > 0) ? this.ariaLabel : this.value}" ariaExpanded="${this.ariaExpanded.length > 0 ? this.ariaExpanded : nothing}" ?disabled="${this.disabled}" ?toggled="${this.toggled}" id="${this.#internalElementId}" ?headerItem="${this.headerItem}" icon="${this.icon}" iconAppearance="${this.iconAppearance}"><slot name="count"></slot></otc-button>${(this.children.length > 0 && this.children[0].tagName !== 'OTC-BADGE') ? this.#getMenuTemplate() : nothing}`;
    }

    return html`<otc-button ariaLabel="${(this.ariaLabel.length > 0) ? this.ariaLabel : this.value}" ariaExpanded="${this.ariaExpanded.length > 0 ? this.ariaExpanded : nothing}" ?disabled="${this.disabled}" ?toggled="${this.toggled}" id="${this.#internalElementId}" size="${this.size}" type="subtle"><otc-icon svg="${this.svg}" type="subtle"></otc-icon><slot name="count"></slot></otc-button>${(this.children.length > 0 && this.children[0].tagName !== 'OTC-BADGE') ? this.#getMenuTemplate() : nothing}`;
  }

  #getTextButtonTemplate() {
    if (this._themeIsCarbonFiber) {
      return html`<div class="ot-toolbar-item-wrapper"><otc-button ariaLabel="${(this.ariaLabel.length > 0) ? this.ariaLabel : this.value}" ariaExpanded="${this.ariaExpanded.length > 0 ? this.ariaExpanded : nothing}" ?disabled="${this.disabled}" id="${this.#internalElementId}" size="${this.size}" type="inline">${this.value} ${this.#hasBadgeSlotElements() ? html`<slot name="badge">${this.badge}</slot>` : nothing} ${(!this.#hasBadgeSlotElements() && (this.children.length > 0)) ? this.#getMenuCaretIconTemplate() : nothing}</otc-button>${(this.children.length > 0) ? this.#getMenuTemplate() : nothing}</div>`;
    }

    return html`<div class="ot-toolbar-item-wrapper"><otc-button ariaLabel="${(this.ariaLabel.length > 0) ? this.ariaLabel : this.value}" ariaExpanded="${this.ariaExpanded.length > 0 ? this.ariaExpanded : nothing}" ?disabled="${this.disabled}" id="${this.#internalElementId}" size="${this.size}" type="${(!this.#hasBadgeSlotElements() && (this.children.length > 0)) ? 'subtleDropdown' : 'subtle'}">${this.#hasBadgeSlotElements() ? html`<slot name="badge">${this.badge}</slot>` : nothing} ${this.value}</otc-button>${(this.children.length > 0) ? this.#getMenuTemplate() : nothing}</div>`;
  }

  #getMenuTemplate() {
    return html`<otc-menu ${n(this.#partRefs.menu)} ariaLabel="${(this.ariaLabel.length > 0) ? this.ariaLabel : this.value}" buttonId="${this.#internalElementId}" ?clearAll="${this.clearAll}" ?isOpen="${this.menuOpen}" ?scrollable="${this.scrollable}" ?usePopover="${this.usePopover}" @clearAll="${this.#handleClearAll}"><slot></slot></otc-menu>`;
  }

  #getMenuCaretIconTemplate() {
    return html`<otc-icon ?disabled="${this.disabled}" icon="${OTC_ICON_BUNDLE_WC_ACTION_16}:action_caret_down16" isPresentation></otc-icon>`;
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

    // If the icon/svg property is set, we should render as an icon only button.
    if (this.icon || this.svg) {
      return this.#getIconButtonTemplate();
    }

    // If no other scenarios are true, we should render as a text button.
    return this.#getTextButtonTemplate();
  }
}

customElements.define('otc-toolbaritem', OtcToolbarItem);

export { OtcToolbarItem };
//# sourceMappingURL=otcToolbarItem.js.map
