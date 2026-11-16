/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import toolbarStyles from './otcToolbar.scss.js';
import { OverflowMixin } from '../overflowMixin.js';
import { RTLController } from '../../controllers/rtlController.js';
import { isChild } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { Console } from '../../utilities/logging-utilities.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';

const OverflowElement = OverflowMixin(ElementBase);

/**
 * The Toolbar component can be used for layout of a horizontal row of actions, usually represented as `otc-toolbaritem` components.
 * @prop {string} ariaLabel Defines the aria label associated with the toolbar.
 * @prop {number} [maxItems=0] The maximum number of items to display, including the overflow menu button.
 * @prop {string} [overflowMenuAriaLabel='More actions'] Defines the aria label associated with the overflow menu button.
 * @prop {string} [overflowMenuIconAppearance=''] Defines the icon appearance of the overflow menu button.
 * @prop {string} [overflowMenuTitle='More actions'] Defines the title of the overflow menu button.
 * @prop {boolean} [wrapWideItems=false] Automatically display items in an overflow menu when they would exceed the width of the container.
 * @cssprop [--ot-toolbar-gap=16px] The gap between items in the toolbar.
 * @slot unnamed Defines the contents of the toolbar.  For best results, use `otc-toolbaritem` components.
 */
class OtcToolbar extends OverflowElement {
  #rtlController = new RTLController(this);

  #lastUsed = null;

  #defaultSlotRef = e();

  #childAttributeMutationObserver = new MutationObserver(this.#handleChildAttributeMutation.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      OverflowElement.styles,
      toolbarStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
    };

    return { ...super.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';

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

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    // Update the tabIndex based on the number of child elements.  Later changes to the child elements will update the tabIndex in
    // `#handleSlotChange`.
    this.#updateTabIndex();
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
    return this.allElements.filter(e => (FocusUtilities.isFocusableElement(e) && !FocusUtilities.isHidden(e)));
  }

  #handleFocusIn(event) {
    // Only focus an element if the target is the toolbar itself.
    if ((event.target === this) && !isChild(this.overflowButtonRef.value, event.composedPath()[0])) {
      if (this.#lastUsed) {
        Console.log('otc-toolbar: #handleFocusIn: Focusing on last used item: ', this.#lastUsed);
        // Focus on the last used element.
        FocusUtilities.focusElement(this.#lastUsed);
      } else {
        Console.log('otc-toolbar: #handleFocusIn: Focusing on first item: ', this.allElements[0]);
        // Focus on the first child item.
        FocusUtilities.focusElement(this.allElements[0]);
      }

      Console.log('otc-toolbar: #handleFocusIn: Setting negative tabIndex on : ', this);
      // Set the `tabIndex` of the `otc-toolbar` to -1 so that using Tab/Shift+Tab to leave the toolbar goes to the next/previous element
      // and not the toolbar itself.
      this.tabIndex = -1;
    }
  }

  #handleFocusOut(event) {
    Console.log('otc-toolbar: #handleFocusOut: Losing focus: ', event);

    if (!isChild(this, event.relatedTarget)) {
      Console.log('otc-toolbar: #handleFocusOut: Setting positive tabIndex on : ', this);
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

        Console.log('otc-toolbar: #handleFocusOut: Saving last used item: ', lastUsed);
        this.#lastUsed = lastUsed;
      }
    }
  }

  #handleSlotChange() {
    this.#updateTabIndex();

    this.childElements.forEach((element) => {
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
      Console.log('otc-toolbar: #preventTabbing: Setting negative tabIndex on: ', element);
      element.tabIndex = -1;
    }

    // Check for any tabbable elements in the shadow root and prevent tabbing on them as well.
    if (element.shadowRoot) {
      const tabbableChildren = Array.from(element.shadowRoot.querySelectorAll('[tabIndex="0"]'));
      for (const child of tabbableChildren) {
        Console.log('otc-toolbar: #preventTabbing: Setting negative tabIndex on: ', child);
        child.tabIndex = -1;
      }
    }
  }

  render() {
    return html`<div class="ot-toolbar-wrapper"><div aria-label="${this.ariaLabel || nothing}" class="ot-toolbar" role="toolbar"><slot ${n(this.#defaultSlotRef)} @slotchange="${this.#handleSlotChange}"></slot>${this.getOverflowButtonTemplate(false)}</div></div>`;
  }
}

customElements.define('otc-toolbar', OtcToolbar);

export { OtcToolbar };
//# sourceMappingURL=otcToolbar.js.map
