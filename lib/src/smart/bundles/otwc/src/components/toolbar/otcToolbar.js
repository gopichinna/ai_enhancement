/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import toolbarStyles from './otcToolbar.scss.js';
import toolbarJatoStyles from './otcToolbarJato.scss.js';
import { OverflowMixin } from '../overflowMixin.js';
import { RTLController } from '../../controllers/rtlController.js';
import { isChild } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { ThemeController } from '../../controllers/themeController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

const OverflowElement = OverflowMixin(ElementBase);

/**
 * The Toolbar component can be used for layout of a horizontal row of actions, usually represented as `otc-toolbaritem` components.
 * @prop {string} ariaLabel Defines the aria label associated with the toolbar.
 * @prop {boolean} disabled The disabled state of the toolbar.
 * @prop {number} [maxItems=0] The maximum number of items to display, including the overflow menu button.
 * @prop {string} [overflowMenuAriaLabel='More actions'] Defines the aria label associated with the overflow menu button.
 * @prop {string} [overflowMenuIconAppearance=''] Defines the icon appearance of the overflow menu button.
 * @prop {boolean} [overflowMenuIsOpen=false] The open state of the overflow menu dropdown.
 * @prop {string} [overflowMenuTitle='More actions'] Defines the title of the overflow menu button.
 * @prop {string} size All toolbar items get this size assigned. Possible values are `small, regular, large`.
 * @prop {string} type The type of the toolbar. Possible values are `toolbar, inline-actions`.
 * @prop {boolean} [usePopover=false] Uses the Popover API to display the menu.
 * @prop {boolean} [wrapWideItems=false] Automatically display items in an overflow menu when they would exceed the width of the container.
 * @prop {boolean} disabled Sets all toolbar items to the disabled state.
 * @cssprop [--ot-toolbar-gap=0px] **Deprecated** The gap between items in the toolbar.
 * @slot unnamed Defines the contents of the toolbar.  For best results, use `otc-toolbaritem` components.
 */
class OtcToolbar extends OverflowElement {
  #themeController = new ThemeController(this);

  #rtlController = new RTLController(this);

  #lastUsed = null;

  #defaultSlotRef = e();

  #childAttributeMutationObserver = new MutationObserver(this.#handleChildAttributeMutation.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      OverflowElement.styles,
      toolbarStyles,
      toolbarJatoStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      size: { type: String, reflect: true },
      type: { type: String, reflect: true },
      tabIndex: { type: String, reflect: true },
    };

    return { ...ThemeController.properties, ...super.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.disabled = false;
    this.size = 'regular';
    this.type = 'toolbar';

    // The toolbar should not be in the tab order unless it contains items.  The tabIndex will be updated in `#handleSlotChange`.
    this.tabIndex = -1;

    this.addEventListener('keydown', this.#handleKeyDown, { capture: true });
    this.addEventListener('focusin', this.#handleFocusIn);
    this.addEventListener('focusout', this.#handleFocusOut);
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  willUpdate(changedProperties) {
    // only need to check changed properties for an expensive computation.
    if (changedProperties.has('type') || changedProperties.has('size')) {
      switch (this.type) {
        case 'inline-actions':
          // size of toolbar and toolbarItems is small, in case of inline-actions
          if (this.size !== 'small') {
            this.setAttribute('size', 'small');
          }
          break;
      }
    }
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // Update the tabIndex based on the number of child elements.  Later changes to the child elements will update the tabIndex in
    // `#handleSlotChange`.
    this.#updateTabIndex();
  }

  async updated(changedProperties) {
    super.updated(changedProperties);

    await this.updateComplete;

    this.childElements.forEach((element) => {
      if (element.nodeName === 'OTC-BUTTON' || element.nodeName === 'OTC-TOOLBARITEM' || element.nodeName === 'OTC-TOOLBARPLACEHOLDER') {
        this.#adjustElementInSlot(element);
      }
    });
  }

  #handleKeyDown(event) {
    // If the event target is the toolbar itself, get the actual active element.
    const activeElement = ((this === event.target) ? event.composedPath()[0] : event.target);

    // Get all elements of the toolbar that are currently focusable.
    const focusableElements = this.#focusableElements;
    let activeElementIndex = focusableElements.indexOf(activeElement.shadowRoot?.activeElement ?? activeElement);

    // If we couldn't find the active element in the array of focusable elements, it may be an element in the shadow root of one of the
    // focusable elements.
    if (activeElementIndex === -1) {
      const childrenOfFocusableElements = focusableElements.filter(e => isChild(e, activeElement));
      if (childrenOfFocusableElements.length > 0) {
        activeElementIndex = focusableElements.indexOf(childrenOfFocusableElements[0]);
      }
    }

    // We only deal with direct descendants of the toolbar, meaning its children or the overflow menu button.  Any child items, such as
    // items in menus, are not processed here.
    if ((activeElementIndex >= 0) && !this.overflowSlotElements.some(e => isChild(e, activeElement))) {
      if (((event.key === 'ArrowLeft') && !this.#rtlController.isRTL)
         || ((event.key === 'ArrowRight') && this.#rtlController.isRTL)) {
        // Focus the previous item, unless we are already at the beginning of the toolbar.
        if (activeElementIndex > 0) {
          // Close any open menu associated with this item.
          const openMenuElement = focusableElements.at(activeElementIndex).shadowRoot.querySelector('otc-menu[isOpen]');
          if (openMenuElement) {
            openMenuElement.isOpen = false;
          }

          // Focus the previous item.
          FocusUtilities.focusElement(focusableElements.at(activeElementIndex - 1));

          // Stop the window from scrolling.
          event.preventDefault();

          // Stop the event from propagating.
          event.stopPropagation();
        }
      }

      if (((event.key === 'ArrowLeft') && this.#rtlController.isRTL)
        || ((event.key === 'ArrowRight') && !this.#rtlController.isRTL)) {
        // Focus the next item, unless we are already at the end of the toolbar.
        if ((activeElementIndex + 1) < focusableElements.length) {
          // Close any open menu associated with this item.
          const openMenuElement = focusableElements.at(activeElementIndex).shadowRoot.querySelector('otc-menu[isOpen]');
          if (openMenuElement) {
            openMenuElement.isOpen = false;
          }

          // Focus the next item.
          FocusUtilities.focusElement(focusableElements.at(activeElementIndex + 1));

          // Stop the window from scrolling.
          event.preventDefault();

          // Stop the event from propagating.
          event.stopPropagation();
        }
      }

      if (event.key === 'Home') {
        // Stop the window from scrolling.
        event.preventDefault();

        // Focus the first item.
        FocusUtilities.focusFirstItem(focusableElements);

        // Stop the event from propagating.
        event.stopPropagation();
      }

      if (event.key === 'End') {
        // Stop the window from scrolling.
        event.preventDefault();

        // Focus the last item.
        FocusUtilities.focusFirstItem([...focusableElements].reverse());

        // Stop the event from propagating.
        event.stopPropagation();
      }
    }

    // Check to see if we are trying to use the arrow keys to go up from the topmost item in the overflow menu.  We don't want to focus the
    // previous item, as it would be outside of the overflow menu.
    if ((event.key === 'ArrowUp') && (activeElement === this.overflowSlotElements.at(0))) {
      // Stop the window from scrolling.
      event.preventDefault();

      // Stop the event from propagating.
      event.stopPropagation();
    }
  }

  get #focusableElements() {
    return this.allElements.filter(e => (FocusUtilities.isFocusableElement(e) && e.checkVisibility()));
  }

  #handleFocusIn(event) {
    // Only focus an element if the target is the toolbar itself.
    if ((event.target === this) && !isChild(this.overflowButtonRef.value, event.composedPath()[0])) {
      if (this.#lastUsed && this.#lastUsed.checkVisibility()) {
        Console.log('otc-toolbar: #handleFocusIn: Focusing on last used item: ', this.#lastUsed);
        // Focus on the last used element.
        FocusUtilities.focusElement(this.#lastUsed);
      } else {
        Console.log('otc-toolbar: #handleFocusIn: Focusing on first item: ', this.#focusableElements[0]);
        // Focus on the first child item.
        FocusUtilities.focusElement(this.#focusableElements[0]);
      }
      // Set the `tabIndex` of the `otc-toolbar` to -1 so that using Tab/Shift+Tab to leave the toolbar goes to the next/previous element
      // and not the toolbar itself.
      this.tabIndex = -1;
    }
  }

  #handleFocusOut(event) {

    if (!isChild(this, event.relatedTarget)) {
      // The `relatedTarget` is not the toolbar or one of it's slotted elements, so we must be leaving the toolbar.  In this case, restore
      // the `tabIndex` of the toolbar so we can Tab/Shift+Tab back into it.
      this.tabIndex = 0;

      // Save the last used element so that we can focus it again when we Tab/Shift+Tab back into the toolbar.
      if (event.composedPath().some(el => el === this.overflowButtonRef.value)) {
        // If the current element is in the overflow menu, we want to save the overflow button itself as the last used element.
        this.#lastUsed = this.overflowButtonRef.value;
      } else {
        // Nested elements are displayed in a menu, which will be closed when the toolbar loses focus.  If we were to save this element, we
        // would not be able to focus it when returning to the toolbar because the menu will be hidden.  Instead, we will look for the
        // element directly displayed on the toolbar that contains the event target.  If the event target is a nested element, then
        // `contains` will return the parent element that is directly displayed on the toolbar.  Since `contains` also returns true when
        // it matches itself, if the event target is already directly displayed on toolbar then it will still return the correct element.
        let lastUsed = this.allElements.filter(e => e.contains(event.target)).at(0);

        // If the last used element is an `otc-menu`, we actually want to store the associated button since the menu itself will have been
        // closed when leaving the toolbar.
        if (lastUsed?.tagName === 'OTC-MENU') {
          lastUsed = document.getElementById(lastUsed.buttonId);
        }
        this.#lastUsed = lastUsed;
      }
    }
  }

  #adjustElementInSlot(element) {
    let attributesToAdjust;
    if (this._themeIsCarbonFiber) {
      attributesToAdjust = ['disabled'];
    } else {
      attributesToAdjust = ['disabled', 'size'];
    }
    for (const attr of attributesToAdjust) {
      if (this.hasAttribute(attr)) {
        const newAttrValue = this.getAttribute(attr);
        element.setAttribute(attr, newAttrValue);
      } else {
        element.removeAttribute(attr);
      }
    }
  }

  async #handleSlotChange() {
    await this.updateComplete;

    this.#updateTabIndex();

    this.childElements.forEach((element) => {
      if (element.nodeName === 'OTC-BUTTON' || element.nodeName === 'OTC-TOOLBARITEM' || element.nodeName === 'OTC-TOOLBARPLACEHOLDER') {
        this.#adjustElementInSlot(element);
      }

      // Set the `tabIndex` property on our child elements so that normal Tab/Shift+Tab will not reach them, but we can still use the
      // arrow keys in our `keydown` handler to focus them programmatically.
      if (element.updateComplete) {
        element.updateComplete.then(() => { this.#preventTabbing(element); });
      } else {
        this.#preventTabbing(element);
      }

      // Also, observe them with a mutation observer so we can prevent tabbing whenever their attributes change, e.g.
      // `otc-widget-header-folder-title` toggles editing mode.
      this.#childAttributeMutationObserver.observe(element, { attributes: true });
    });

    // If the last used element no longer exists in our slot, reset the `#lastUsed` property so that we don't try to focus it.
    if (!isChild(this, this.#lastUsed)) {
      Console.log('otc-toolbar: #handleSlotChange: Clearing last used item: ', this.#lastUsed);
      this.#lastUsed = null;
    }
  }

  #handleChildAttributeMutation(records) {
    // When the attributes of one of our components change it is re-rendered, which can lose the negative tabindex we set in
    // `#handleSlotChange`.  We need to preserve the negative tabindex on all slotted components to ensure arrow key navigation
    // works properly.
    for (const record of records) {
      this.#preventTabbing(record.target);
    }
  }

  #updateTabIndex() {
    if (this.#focusableElements.length > 0) {
      // If the toolbar has focusable children, set the tabIndex so that it can be reached in the tab order.
      this.tabIndex = 0;
    } else {
      // If the toolbar does not have focusable children, set the tabIndex so that it can not be reached in the tab order.
      this.tabIndex = -1;
    }
  }

  #preventTabbing(element) {
    // Only set `tabIndex` if the element already has a positive `tabIndex` property.  Elements like `otc-menu` do not have a tabIndex
    // property, so they are skipped by both Tab/Shift+Tab and the arrow keys.  If we were to explicitly set it to "-1", it would become
    // focusable, which we do not want.
    if (element.tabIndex >= 0) {
      element.tabIndex = -1;
    }

    // Check for any tabbable elements in the shadow root and prevent tabbing on them as well.
    if (element.shadowRoot) {
      const tabbableChildren = Array.from(element.shadowRoot.querySelectorAll('[tabIndex="0"]'));
      for (const child of tabbableChildren) {
        child.tabIndex = -1;
      }
    }
  }

  #getTypeSpecificClassesForToolbarWrapper() {
    return {
      'ot-toolbar-wrapper-jato': !this._themeIsCarbonFiber,
      'ot-toolbar-wrapper': true,
      'ot-toolbar-wrapper--is-inline-actions': this.type === 'inline-actions',
    };
  }

  #getTypeSpecificClassesForToolbar() {
    return {
      'ot-toolbar-jato': !this._themeIsCarbonFiber,
      'ot-toolbar': true,
      'ot-toolbar--is-inline-actions': this.type === 'inline-actions',
      'ot-toolbar-jato--is-small': this.type === 'inline-actions' || this.size === 'small' || this.size === '',
      'ot-toolbar-jato--is-large': !this.type === 'inline-actions' && this.size === 'large',
    };
  }

  render() {
    return html`<div class="${e$1(this.#getTypeSpecificClassesForToolbarWrapper())}"><div aria-label="${this.ariaLabel || nothing}" class="${e$1(this.#getTypeSpecificClassesForToolbar())}" role="toolbar"><slot ${n(this.#defaultSlotRef)} @slotchange="${this.#handleSlotChange}"></slot>${this.getOverflowButtonTemplate(false, this._themeIsCarbonFiber)}</div></div>`;
  }
}

customElements.define('otc-toolbar', OtcToolbar);

export { OtcToolbar };
//# sourceMappingURL=otcToolbar.js.map
