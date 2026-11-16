import { html, nothing } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import dropDownStyleSheet from '../../styles/dropdown.scss.js';
import otcMenuStyles from './otcMenu.scss.js';
import { flattenElementArray, isChild, getViewportWidth, getViewportHeight } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { styleMap as o } from '../../../node_modules/lit-html/directives/style-map.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/* eslint-disable lit-a11y/list */

/**
 * The Menu component represents a dropdown list of items that a user can activate to perform actions.
 * @prop {string} ariaLabel Defines the aria-label of the menu dropdown.
 * @prop {string} ariaRole The role that should be applied to the menu dropdown.
 * @prop {string} buttonAlignment Determines which side of the button the dropdown will align itself to.
 * @prop {string} buttonId Defines the id of the button that is associated with the menu.
 * @prop {boolean} clearAll Determines whether or not to show the "Clear all" menu action item.
 * @prop {string} clearAllText Overrides the default "Clear all" text.
 * @prop {boolean} forceOpenDown Force the menu to always open down.
 * **Note:** setting this property bypasses the logic that repositions the menu if it would appear off screen.
 * @prop {boolean} forceOpenUp Force the menu to always open up.
 * **Note:** setting this property bypasses the logic that repositions the menu if it would appear off screen.
 * @prop {boolean} isOpen The open state of menu dropdown.
 * @prop {boolean} isSearch Defines if menu is being used in the context of the header bar search.
 * @prop {boolean} isSubmenu Defines if menu is being used as the dropdown of a submenu item.
 * @prop {boolean} isWide Defines if menu should use the full width of the container.
 * @prop {number} maxItems The number of items to display initially.
 * Items after this will be hidden and a "Show More" item will be displayed automatically to allow them to be displayed.
 * @prop {boolean} scrollable Determines if the menu dropdown should be limited to the height of the viewport with an added scrollbar.
 * @prop {string} showMoreText Overrides the default "Show more" text.
 * @slot unnamed Defines the content of the menu.
 * **Note: ** It is strongly recommended that you only use `otc-menucheckbox`, `otc-menudivider`, `otc-menugroup`, `otc-menuitem`,
 * `otc-menuradio`, or `otc-submenu` components in order to preserve the intended design.
 * @fires change Fired when the checked value of an `otc-menucheckbox` is changed.
 * @fires clear-all Fired when the "Clear all" menu action item is clicked.
 * @fires close Fired when the menu gets closed.
 * @fires item-click Fired when an `otc-menuitem` is activated through either the mouse or keyboard.
 * @fires item-remove Fired when clicking the "X" icon on an `otc-menuitem` with the `isDeletable` property.
 * @fires open Fired when the animation of the main menu has finished.
 */
class OtcMenu extends ElementBase {
  #rtlController = new RTLController(this);

  #boundDocumentClickHandler = this.#handleDocumentClick.bind(this);

  #boundWindowResizeHandler = this.#handleWindowResize.bind(this);

  #boundButtonClickHandler = this.#handleButtonClick.bind(this);

  #boundButtonKeyDownHandler = this.#handleButtonKeyDown.bind(this);

  #animationWrapperResizeObserver = new ResizeObserver(this.#handleAnimationWrapperResize.bind(this));

  // The "Show more" item that is dynamically shown and hidden based on the `maxItems` property.
  #showMoreItemId = 'otc-showmore-item';

  // The "Clear all" item that is dynamically shown and hidden based on the `clearAll` property.
  #clearAllItemId = 'otc-clearall-item';

  // The calculated padding on the dropdown menu.  This is used when restricting the height of the dropdown menu through the `maxItems` or
  // `scrollable` properties.
  #dropdownMenuPadding = 0;

  // The calculated gap between menu items.  This is used when restricting the height of the dropdown menu through the `maxItems` or
  // `scrollable` properties.
  #menuItemGap = 0;

  // The overlap of the submenu on its parent.
  #submenuOverlap = 4;

  // Used internally to access elements in the shadow root.
  #partRefs = {
    actionsWrapper: e(),
    animationWrapper: e(),
    clearAllItem: e(),
    dropdown: e(),
    dropdownMenu: e(),
    itemsWrapper: e(),
    showMoreItem: e(),
    slot: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      dropDownStyleSheet,
      otcMenuStyles,
    ];
  }

  static get properties() {
    return {
      ariaLabel: { type: String, reflect: true },
      ariaRole: { type: String, reflect: true },
      buttonAlignment: { type: String, reflect: true },
      buttonId: { type: String, reflect: true },
      clearAll: { type: Boolean, reflect: true },
      clearAllText: { type: String, reflect: true },
      forceOpenDown: { type: Boolean, reflect: true },
      forceOpenUp: { type: Boolean, reflect: true },
      isOpen: { type: Boolean, reflect: true },
      isSearch: { type: Boolean, reflect: true },
      isSubmenu: { type: Boolean, reflect: true },
      isWide: { type: Boolean, reflect: true },
      maxItems: { type: Number, reflect: true },
      scrollable: { type: Boolean, reflect: true },
      showMoreText: { type: String, reflect: true },
      _dropdownMenuHeight: { state: true },
      _showShowMoreItem: { state: true },
    };
  }

  constructor() {
    super();

    this.ariaRole = 'menu';
    this.ariaLabel = '';
    this.buttonAlignment = 'start';
    this.buttonId = '';
    this.clearAll = false;
    this.clearAllText = 'Clear all';
    this.forceOpenDown = false;
    this.forceOpenUp = false;
    this.isOpen = false;
    this.isSearch = false;
    this.isSubmenu = false;
    this.isWide = false;
    this.maxItems = 0;
    this.scrollable = false;
    this.showMoreText = 'Show more';

    // Our render implementation will convert this to 'unset'.  We don't want to restrict the first render.  It will be updated to the
    // correct value after rendering.
    this._dropdownMenuHeight = 0;

    this._showShowMoreItem = false;

    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeyDown);
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }

    // Determine the dropdown menu padding.
    const dropdownMenu = this.#partRefs.dropdownMenu.value;
    this.#dropdownMenuPadding = parseInt(getComputedStyle(dropdownMenu).paddingTop, 10)
      + parseInt(getComputedStyle(dropdownMenu).paddingBottom, 10);

    // Determine the menu item gap.
    const itemsWrapper = this.#partRefs.itemsWrapper.value;
    this.#menuItemGap = parseInt(getComputedStyle(itemsWrapper).gap, 10);

    // Add a resize observer to the animation wrapper so that we can sync the dropdown menu with its size.
    this.#animationWrapperResizeObserver.observe(this.#partRefs.animationWrapper.value);

    // Add the document click handler so that we can listen for the escape key to close the menu.
    document.addEventListener('click', this.#boundDocumentClickHandler);

    // Add a window resize handler that will reposition the menu in relation to the changing position of the button.
    window.addEventListener('resize', this.#boundWindowResizeHandler);

    // Add handlers to the menu button.
    if (!this.isSubmenu) {
      this.#addMenuButtonListeners(this.#menuButton);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove any handlers that were added in connectedCallback().
    this.#removeMenuButtonListeners(this.#menuButton);
    window.removeEventListener('resize', this.#boundWindowResizeHandler);
    document.removeEventListener('click', this.#boundDocumentClickHandler);
    this.#animationWrapperResizeObserver.disconnect();
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('isOpen')) {
      // Update the `menuOpen` property of our associated button.
      this.#setButtonMenuOpen();

      if (!this.isOpen) {
        // Close all submenus when the parent menu closes.
        const submenus = this.getElementsByTagName('otc-submenu');
        for (const submenu of submenus) {
          submenu.updateComplete?.then(() => {
            submenu.isOpen = false;
          });
        }
      }

      // Notify all children that they should update, so that the animation class can be properly applied.
      const menuItems = flattenElementArray(this.#slottedElements, true);
      menuItems.forEach((item) => { item._showAnimation = this.isOpen; });
    }
  }

  updated(changedProperties) {
    // If the `maxItems` or `scrollable` properties change or the menu goes from closed to open, reset the state of the "Show more" item.
    if (changedProperties.has('maxItems') || changedProperties.has('scrollable') || (changedProperties.has('isOpen') && this.isOpen)) {
      // Reset the state of the "Show more" item.
      this.#resetShowMoreState();

      // Reset the height restriction from the scrollable property.
      this.#resetScrollableHeight();
    }

    // If the "Show more" mode changes or the number of max items changes, ensure that the all menu items have the correct 'hidden' state.
    if (changedProperties.has('_showShowMoreItem') || changedProperties.has('maxItems')) {
      this.#resetHiddenMenuItems();
    }

    if (changedProperties.has('isOpen')) {
      // Dispatch open and close events.
      if (!this.isOpen) {
        // There is no close animation, so we can just dispatch the event immediately.
        const closeEvent = new CustomEvent('close', { bubbles: true, composed: true });
        this.dispatchEvent(closeEvent);
      } else {
        // This event will only be dispatched when all animations on the dropdown element have finished.
        const dropdown = this.#partRefs.dropdown.value;
        const dropdownAnimationPromises = dropdown.getAnimations().map(animation => animation.finished);
        Promise.all(dropdownAnimationPromises).then(() => {
          const openEvent = new CustomEvent('open', { bubbles: true, composed: true });
          this.dispatchEvent(openEvent);
        });
      }
    }

    if (changedProperties.has('buttonId') && !this.isSubmenu) {
      // Remove the handlers from the old button, if it still exists.
      const oldButtonId = changedProperties.get('buttonId');
      const oldButtonElement = Array.from(document.querySelectorAll(`[id="${oldButtonId}"]`))
        .filter(e => !FocusUtilities.isHidden(e))?.at(0);
      this.#removeMenuButtonListeners(oldButtonElement);

      // Add the handlers to the new button.
      this.#addMenuButtonListeners(this.#menuButton);
    }

    if (this.isOpen) {
      // Set the position of the dropdown relative to the button.
      this.#setMenuStyles();
    }
  }

  #addMenuButtonListeners(menuButton) {
    if (menuButton) {
      // First, remove any existing handlers to prevent duplicates.
      this.#removeMenuButtonListeners(menuButton);

      // Add the handlers to the menu button.
      menuButton.addEventListener('click', this.#boundButtonClickHandler);
      menuButton.addEventListener('click', this.#boundButtonClickHandler);
      menuButton.addEventListener('keydown', this.#boundButtonKeyDownHandler);
      menuButton.setAttribute('aria-haspopup', 'menu');
    }
  }

  #removeMenuButtonListeners(menuButton) {
    if (menuButton) {
      // Remove the handlers from the menu button.
      menuButton.removeEventListener('click', this.#boundButtonClickHandler);
      menuButton.removeEventListener('keydown', this.#boundButtonKeyDownHandler);
      menuButton.removeAttribute('aria-haspopup');
    }
  }

  #setButtonMenuOpen() {
    const menuButtonElement = this.#menuButtonElement;
    if (menuButtonElement) {
      if (menuButtonElement.menuOpen === undefined) {
        // If it does not have a 'menuOpen' property, e.g. it is not one of our web components, then set 'aria-expanded' directly.
        menuButtonElement.setAttribute('aria-expanded', this.isOpen);
      } else {
        // If it does have a 'menuOpen' property, e.g. it is one of our web components, then set 'menuOpen'.  The web component will set
        // 'aria-expanded' on the proper element in the shadow root itself.
        menuButtonElement.menuOpen = this.isOpen;
      }
    }
  }

  #handleButtonClick(event) {
    if (this.isOpen) {
      this.isOpen = false;
    } else if (event.target && !event.target.disabled && !event.target.readonly) {
      this.isOpen = true;
    }
  }

  get #menuButtonElement() {
    let menuButtonElement = null;

    if (this.buttonId) {
      // Get the element specified by the buttonId property.  In Storybook, when switching from an individual story back to the Docs page,
      // it will simply set the elements of the previous story to hidden before displaying the Docs page.  This means that there are
      // actually duplicate elements on the page with the same id, the hidden one from the previous story and the visible one on the Docs
      // page.  So, instead of using `getElementById`, which would only return the first/hidden element, we will use `querySelectorAll` and
      // filter out the hidden elements.
      const menuButtonElements = Array.from(document.querySelectorAll(`[id="${this.buttonId}"]`));

      if (menuButtonElements.length === 1) {
        // If there is only one element, we can use it directly.
        menuButtonElement = menuButtonElements.at(0);
      } else {
        // If there is more than one element, we will use the first non-hidden element.
        const visibleMenuButtonElements = menuButtonElements?.filter(e => !FocusUtilities.isHidden(e));
        menuButtonElement = visibleMenuButtonElements?.at(0);
      }

      if (!menuButtonElement) {
        // If we couldn't find the element, it may be because we are in the shadow root of another component along with the button we are
        // looking for.
        menuButtonElement = this.getRootNode()?.getElementById?.(this.buttonId);
      }
    }

    return menuButtonElement;
  }

  get #menuButton() {
    // Get the element specified by the buttonId property.
    const menuButtonElement = this.#menuButtonElement;

    // Check to see if this is a web component with a shadow root.  Our otc-button will have one, but they could be using just a regular
    // button to control the menu.
    if (menuButtonElement && menuButtonElement.shadowRoot) {
      const shadowButtonElement = menuButtonElement.shadowRoot.querySelector('button');

      // If we found a button element in the shadow root, return that.
      if (shadowButtonElement) {
        return shadowButtonElement;
      }
    }

    // If we didn't find a button element in the shadow root, return the element specified by the buttonId property.
    return menuButtonElement;
  }

  get #slottedElements() {
    return this.#partRefs.slot.value?.assignedElements({ flatten: true });
  }

  get #menuButtonSpacing() {
    // The UXD for select specifies no space between the input and the dropdown.
    if (this.#menuButton?.tagName === 'OTC-SELECT') {
      return 0;
    }

    // The UXD for the normal menu specifies a 4px between the button and the menu.
    return 4;
  }

  #handleAnimationWrapperResize() {
    // Update the height of the dropdown menu.
    const animationWrapper = this.#partRefs.animationWrapper.value;
    this._dropdownMenuHeight = animationWrapper.scrollHeight;
  }

  #handleClick(event) {
    if (this.isOpen && isChild(this, event.target)
        && ((event.target.tagName === 'OTC-MENUITEM') || (event.target.tagName === 'OTC-TOOLBARITEM'))) {
      // If the target is one of our child menu items, close the menu.  We don't close the menu for other types (labels, submenus, etc.).
      this.isOpen = false;
    }
  }

  #handleClearAllClick() {
    this.dispatchEvent(new CustomEvent('clear-all', {
      bubbles: true,
    }));
  }

  #handleClearAllKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        this.#handleClearAllClick();

        // Prevent the default action, otherwise Spacebar will also scroll the page.
        event.preventDefault();
        break;

      case 'ArrowUp': {
        const slottedElements = this.#slottedElements;
        if (slottedElements) {
          // Focus the last slotted item.
          FocusUtilities.focusFirstItem(this.#slottedElements.reverse());

          // Prevent the default action, otherwise Down Arrow will also scroll the page.
          event.preventDefault();

          // Stop the event from propagating.
          event.stopPropagation();
        }

        break;
      }

      // no default
    }
  }

  #handleShowMoreClick() {
    // Hide the "Show more" item.
    this._showShowMoreItem = false;
  }

  #handleShowMoreKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ': {
        // Find the last unhidden element before the "Show more" item.
        const menuItems = flattenElementArray(this.#slottedElements);
        const lastElement = menuItems.findLast(e => e.style.getPropertyValue('display') !== 'none');

        // Hide the "Show more" item.
        this._showShowMoreItem = false;

        // Focus on the first newly revealed menu item.
        FocusUtilities.focusNextItem(lastElement);

        // Prevent the default action, otherwise Spacebar will also scroll the page.
        event.preventDefault();
        break;
      }

      case 'ArrowUp': {
        const menuItems = flattenElementArray(this.#slottedElements);
        const visibleMenuItems = menuItems.filter(x => !FocusUtilities.isHidden(x));

        // Focus the last visible menu item.
        FocusUtilities.focusElement(visibleMenuItems.at(-1));

        // Stop the event from propagating.
        event.stopPropagation();

        break;
      }

      // no default
    }
  }

  #closeMenuIfFocusLost(newTarget) {
    // If we don't know the new target, close the menu.
    if (!newTarget) {
      if (this.isOpen && !this.isSearch) {
        this.isOpen = false;
      }
    } else {
      const isMenuChild = isChild(this, newTarget);

      let isButtonChild = false;
      const menuButtonElement = this.#menuButtonElement;
      if (menuButtonElement) {
        // Check both the light DOM and shadow DOM of the button for the new target.
        isButtonChild = isChild(menuButtonElement, newTarget);
      }

      // If the new target is not a child of the menu or our associated button, close the menu.
      if (!isMenuChild && !isButtonChild) {
        if (this.isOpen && !this.isSearch) {
          this.isOpen = false;
        }
      }
    }
  }

  #handleDocumentClick(event) {
    if (this.isOpen && !this.isSearch) {
      // We can't just use `event.target` because of cases like the overflow menu in `otc-toolbar`.  In that case, the overflow menu button
      // is in the shadow root of the toolbar and will generate a click event that is re-targeted to the `otc-toolbar` itself.  If we were
      // to use `event.target`, there is no way to differentiate between an actual click somewhere else on the toolbar and the re-targeted
      // event when clicking on the overflow menu button.
      //
      // Instead we will check the last item in the composed path and see if it is contained in a shadow root.  If so, we will use it's host
      // element as the new target.  If not, we are probably just dealing with a standard HTML element and can use `event.target` directly.
      const target = event.composedPath()[0].getRootNode()?.host ?? event.target;
      this.#closeMenuIfFocusLost(target);
    }
  }

  #handleWindowResize() {
    // Set the position of the dropdown relative to the button.
    this.#setMenuStyles();
  }

  #handleKeyDown(event) {
    switch (event.key) {
      case 'Escape':
      case 'Esc':
        if (this.isOpen && !this.isSearch) {
          // Stop the default 'Escape' action.
          event.preventDefault();

          // Close the menu.
          this.isOpen = false;

          // Focus on the associated button element when closing the menu.
          this.#menuButton?.focus();
        }
        break;

      case 'Enter':
      case 'Spacebar':
      case ' ':
        // When activating a child menu item using the keyboard, the click event is not bubbled up like it is when clicking with the mouse.
        // We need to trigger it manually.
        if (((event.target.tagName === 'OTC-MENUITEM')
              || (event.target.tagName === 'OTC-MENULINK')
              || (event.target.tagName === 'OTC-TOOLBARITEM'))
            && isChild(this, event.target)) {
          this.#handleClick(event);
        }
        break;

      case 'ArrowDown': {
        // Stop the window from scrolling.
        event.preventDefault();

        // Find the last unhidden element before the "Show more" item or "Clear all" item.
        const menuItems = flattenElementArray(this.#slottedElements);
        const lastElement = menuItems.findLast(e => e.style.getPropertyValue('display') !== 'none');

        if (lastElement === event.target) {
          // Focus the "Show more" item or "Clear all" item.
          if (!FocusUtilities.isHidden(this.#partRefs.showMoreItem.value)) {
            FocusUtilities.focusElement(this.#partRefs.showMoreItem.value);
          } else if (!FocusUtilities.isHidden(this.#partRefs.clearAllItem.value)) {
            FocusUtilities.focusElement(this.#partRefs.clearAllItem.value);
          }
        } else {
          // Focus the next item.
          FocusUtilities.focusNextItem(event.target);
        }

        // Stop the event from propagating.
        event.stopPropagation();
        break;
      }

      case 'ArrowUp':
        // Stop the window from scrolling.
        event.preventDefault();

        // Focus the previous item.
        FocusUtilities.focusPreviousItem(event.target);

        // Stop the event from propagating.
        event.stopPropagation();
        break;

      case 'Tab':
        if (!this.isSearch) {
          // Tab does not navigate between menu items, so we must be changing focus to an element outside of the menu.
          // In that case, we should close the menu.
          this.isOpen = false;
        }
        break;

      // no default
    }
  }

  #handleButtonKeyDown(event) {
    switch (event.key) {
      case 'Escape':
      case 'Esc':
        if (this.isOpen) {
          // Stop the default 'Escape' action.
          event.preventDefault();

          // Close the menu.
          this.isOpen = false;
        }
        break;

      case 'Enter':
      case 'Spacebar':
      case ' ':
      case 'ArrowDown': {
        // Stop the window from scrolling.
        event.preventDefault();

        // Only open the menu if it is not empty.
        const slottedElements = this.#slottedElements;
        if (slottedElements && slottedElements.length > 0) {
          this.isOpen = true;

          FocusUtilities.focusFirstItem(slottedElements);

          const menuButton = this.#menuButton;
          if (menuButton && this.isOpen && document.activeElement.matches('otc-button')
              && document.activeElement.shadowRoot?.contains(menuButton)) {
            // The menu button still has focus.  We need to add an event listener so that the menu closes when the menu button loses focus.
            menuButton.addEventListener('focusout', focusOutEvent => this.#handleButtonFocusOut(focusOutEvent), { once: true });
          }
        }
        break;
      }

      // no default
    }
  }

  #handleButtonFocusOut(event) {
    if (!event.relatedTarget || !isChild(this, event.relatedTarget)) {
      this.isOpen = false;
    }
  }

  #handleSlotChange() {
    // Close the menu if it is empty.
    const slottedElements = this.#slottedElements;
    if (slottedElements && slottedElements.length <= 0) {
      this.isOpen = false;
    }

    // Reset the state of the "Show more" item.
    this.#resetShowMoreState();

    // Reset the height restriction from the scrollable property.
    this.#resetScrollableHeight();
  }

  #resetShowMoreState() {
    // Get an array of all elements, including those inside a menu group.
    const flatMenuItems = flattenElementArray(this.#slottedElements);

    // Get the number of focusable items in the menu.  We only check focusable elements because we don't want things like a menu divider to
    // be considered.
    const focusableMenuItems = flatMenuItems.filter(child => FocusUtilities.isFocusableElement(child));

    // The "Show more" item should only be shown if the menu is not scrollable, `maxItems` is set to a positive value, and `maxItems` is
    // less than the number of focusable items in the menu.
    this._showShowMoreItem = (!this.scrollable && (this.maxItems > 0) && (this.maxItems < focusableMenuItems.length));
  }

  #resetHiddenMenuItems() {
    // Get an array of all elements, including those inside a menu group.
    const flatMenuItems = flattenElementArray(this.#slottedElements);

    // If we are currently in "Show more" mode, we need to ensure that all items before `maxItems` are shown and all items from `maxItems`
    // to the end are hidden.
    if (this._showShowMoreItem) {
      // Get the number of focusable items in the menu.  We only check focusable elements because we don't want things like a menu divider
      // to be considered.
      const focusableMenuItems = flatMenuItems.filter(child => FocusUtilities.isFocusableElement(child));

      // Find the first item that should be hidden from the array of focusable menu items.
      const firstHiddenItem = focusableMenuItems[this.maxItems];

      if (firstHiddenItem) {
        // Find the position of the first item that should be hidden in the array of all menu items.
        const firstHiddenItemIndex = flatMenuItems.indexOf(firstHiddenItem);

        // Show all items before the first hidden item.
        const itemsToShow = flatMenuItems.slice(0, firstHiddenItemIndex);
        itemsToShow?.forEach(item => item.style.removeProperty('display'));

        // Hide all items from the first hidden item to the end of the array.
        const itemsToHide = flatMenuItems.slice(firstHiddenItemIndex);
        itemsToHide?.forEach(item => item.style.setProperty('display', 'none', 'important'));
      }
    } else {
      // Clear the hidden attributes of any menu items that were previously hidden behind the "Show more" item.
      flatMenuItems?.forEach(item => item.style.removeProperty('display'));
    }
  }

  #resetScrollableHeight() {
    // Get an array of all elements, including those inside a menu group, including the menu group itself.
    const flatMenuItems = flattenElementArray(this.#slottedElements, true);

    // Get the number of focusable items in the menu.  We only check focusable elements because we don't want things like a menu divider
    // to be considered.  We also don't want to include the menu group in this count.  We need it later to calculate the height because of
    // visible label, but it should not count against the `maxItems` count.
    const focusableMenuItems = flatMenuItems.filter(child => FocusUtilities.isFocusableElement(child) && child.tagName !== 'OTC-MENUGROUP');

    // We only need to restrict the height if `scrollable` is enabled, `maxItems` is a positive number, and `maxItems` is less than the
    // total number of focusable menu items.
    if (this.scrollable && (this.maxItems > 0) && (this.maxItems < focusableMenuItems.length)) {
      // Find the last menu item that should be shown from the array of focusable menu items.
      const lastShownItem = focusableMenuItems[this.maxItems - 1];

      // Get an array of all items that should be shown.
      const shownItems = flatMenuItems.slice(0, flatMenuItems.lastIndexOf(lastShownItem) + 1);

      // Determine the height of all menu items up to and including this menu item.
      let shownItemsHeight = shownItems.reduce((total, item) => {
        if (item.tagName === 'OTC-MENUGROUP') {
          // `otc-menugroup` is a special case.  We only want the height of it's label, not the entire group.
          return total + item.shadowRoot.querySelector('#menu-group-label').clientHeight;
        }

        // Add the item height plus the gap between menu items.
        return total + item.clientHeight;
      }, 0);

      // Determine the number of menu groups.  They add to the height, but they do not add any gap between items.
      const numMenuGroups = shownItems.reduce((total, item) => (item.tagName === 'OTC-MENUGROUP' ? total + 1 : total), 0);

      // Add the gap between items to the height.
      shownItemsHeight += (((shownItems.length - 1) - numMenuGroups) * this.#menuItemGap);

      // Set the max height of the menu dropdown so that items past the `maxItems` property are displayed within the scrollable overflow.
      this.#partRefs.itemsWrapper.value.style.maxHeight = `${shownItemsHeight}px`;
    } else if (this.#partRefs.dropdownMenu.value) {
      // Reset the max height of the menu dropdown.
      this.#partRefs.itemsWrapper.value.style.maxHeight = 'unset';
    }
  }

  // Position the dropdown vertically below the associated button and horizontally aligned with the left or right edge,
  // based on the alignment.
  #setMenuStyles() {
    // If we have an associated button, position the dropdown relative to the button.
    const dropdown = this.#partRefs.dropdown.value;
    const dropdownMenu = this.#partRefs.dropdownMenu.value;
    let menuButton = this.#menuButton;

    if (!dropdown || !dropdownMenu || !menuButton) {
      return;
    }

    if (menuButton.tagName === 'OTC-SELECT') {
      // If we are associated with an 'otc-select' element, we want to position ourselves relative to the inner combobox.
      menuButton = menuButton._selectCombobox;
      if (!menuButton) {
        return;
      }
    }

    // Clear any styles we may have added to reposition the menu previously.
    this.#clearMenuPosition();

    // Clear the animation class, if it was previously added by our menu repositioning as opposed to being added by a property.
    if (!this.forceOpenUp) {
      dropdownMenu.classList.remove('otc-animation-up');
    }

    // Move the dropdown so that it is below and aligned with the left of the button.  All other positioning is calculated as an offset of
    // this position and applied to the dropdown menu.
    this.#setInitialMenuPosition(menuButton, this.#menuButtonSpacing);

    // Reposition the menu if it is opened off screen.
    this.#repositionOffScreenMenu(menuButton, this.#menuButtonSpacing, dropdownMenu);
  }

  #clearMenuPosition() {
    this.style.left = '0';
    this.style.top = '0';
  }

  #setInitialMenuPosition(menuButton) {
    // Get the position of the button.
    const buttonClientRect = menuButton.getBoundingClientRect();

    // Get the initial position of the menu.
    const menuClientRect = this.getBoundingClientRect();

    if (this.isSubmenu) {
      // The top of the submenu should be equal with the top of the button.
      this.style.top = `${buttonClientRect.top - menuClientRect.top}px`;

      if (this.#rtlController.isRTL) {
        // The right edge of the submenu should be in line with the left edge of the button, plus the specified overlap.
        this.style.left = `${buttonClientRect.left - menuClientRect.right + this.#submenuOverlap}px`;
      } else {
        // The left edge of the submenu should be in line with the right edge of the button, minus the specified overlap.
        this.style.left = `${buttonClientRect.right - menuClientRect.left - this.#submenuOverlap}px`;
      }
    } else {
      if (this.forceOpenUp) {
        // The bottom of the menu should be just above the top of the button.
        this.style.top = `${(buttonClientRect.top - menuClientRect.top) - this.#partRefs.dropdownMenu.value.offsetHeight
            - this.#menuButtonSpacing}px`;
      } else {
        // The top of the menu should be just under the bottom of the button.
        this.style.top = `${(buttonClientRect.top - menuClientRect.top) + buttonClientRect.height + this.#menuButtonSpacing}px`;
      }

      if (this.buttonAlignment === 'right'
        || (this.#rtlController.isRTL && (this.buttonAlignment === 'start'))
        || (!this.#rtlController.isRTL && this.buttonAlignment === 'end')) {
        // The right edge of the menu should be in line with the right edge of the button.
        this.style.left = `${buttonClientRect.right - menuClientRect.right}px`;
      } else {
        // The left edge of the menu should be in line with the left edge of the button.
        this.style.left = `${buttonClientRect.left - menuClientRect.left}px`;
      }
    }
  }

  #getBoundingEdges() {
    // Create a TreeWalker with all of our ancestor elements.
    const treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      node => (node.contains(this) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    );

    // Walk through our ancestor nodes to see if any have an overflow setting that could truncate us.
    const ancestorOverflowRects = [];
    while (treeWalker.nextNode()) {
      if (getComputedStyle(treeWalker.currentNode).overflow !== 'visible') {
        ancestorOverflowRects.push(treeWalker.currentNode.getBoundingClientRect());
      }
    }

    // The top bound of the menu is either the top of the viewport (0) or the highest `top` of the of the bounding ancestors, i.e. the
    // furthest down on the page.
    const boundingTop = Math.max(0, ...ancestorOverflowRects.map(x => x.top));

    // The left bound of the menu is either the left side of the viewport (0) or the highest `left` of the bounding ancestors, i.e. the
    // furthest right on the page.
    const boundingLeft = Math.max(0, ...ancestorOverflowRects.map(x => x.left));

    // The right bound of the menu is either the right side of the viewport (getViewportWidth()) or the smallest `right` of the bounding
    // ancestors, i.e. the furthest left on the page.
    const boundingRight = Math.min(getViewportWidth(), ...ancestorOverflowRects.map(x => x.right));

    // The bottom bound of the menu is either the bottom of the viewport (getViewportHeight()) or the smallest `bottom` of the bounding
    // ancestors, i.e. the furthest up on the page.
    const boundingBottom = Math.min(getViewportHeight(), ...ancestorOverflowRects.map(x => x.bottom));

    return {
      boundingTop, boundingLeft, boundingRight, boundingBottom,
    };
  }

  #repositionOffScreenMenu(menuButton, menuButtonSpacing, dropdownMenu) {
    const boundingEdges = this.#getBoundingEdges();

    // Get the position of the menu button.
    const buttonClientRect = menuButton.getBoundingClientRect();

    // Get the position of the menu.
    let menuClientRect = this.getBoundingClientRect();

    // Check to see if the left edge of the dropdown is outside of the viewport or the bounding ancestor element.
    if (menuClientRect.left < boundingEdges.boundingLeft) {
      if (this.isSubmenu) {
        this.style.left = `${0 + this.clientWidth - this.#submenuOverlap}px`;
      } else {
        // Reset the position the dropdown menu so that the left edge matches the left edge of the button.
        this.style.left = '0';

        // Set the left edge of the dropdown to match that of the button.
        this.style.left = `${buttonClientRect.left - this.getBoundingClientRect().left}px`;
      }

      // Update the position of the menu.
      menuClientRect = this.getBoundingClientRect();
    }

    // Check to see if the right edge of the dropdown is outside of the viewport or the bounding ancestor element.
    if (menuClientRect.right > boundingEdges.boundingRight) {
      if (this.isSubmenu) {
        this.style.left = `${0 - this.offsetWidth + this.#submenuOverlap}px`;
      } else {
        // Position the dropdown so that the right edge matches the right edge of the button.
        this.style.left = `${parseInt(this.style.left, 10) - (this.offsetWidth - menuButton.offsetWidth)}px`;
      }

      // Update the position of the menu.
      menuClientRect = this.getBoundingClientRect();
    }

    const calculatedBottom = menuClientRect.top + this._dropdownMenuHeight;

    // Only check the bottom of the dropdown if we are not being forced in a certain direction.
    if (!this.forceOpenDown && !this.forceOpenUp) {
      // Check to see if the bottom of the dropdown is outside of the viewport.
      if (calculatedBottom > boundingEdges.boundingBottom) {
        // Check to see if we have room to open the menu up instead.
        const calculatedBottomOpeningUp = buttonClientRect.top - this._dropdownMenuHeight - menuButtonSpacing;
        if (calculatedBottomOpeningUp > boundingEdges.boundingTop) {
          if (this.isSubmenu) {
            // Offset the top of the menu by subtracting its height and its padding from the origin point.  This would place it above the
            // submenu item, so we need to add back the height of the submenu item.
            this.style.top = `${0 - this._dropdownMenuHeight - this.#dropdownMenuPadding + menuButton.offsetHeight}px`;
          } else {
            // Offset the top of the menu from its current position by subtracting its height, its padding, the height of the button, and
            // twice the height of the menu button spacing, since we want to negate the current spacing below the button and add it to the
            // top of the button.
            this.style.top = `${parseInt(this.style.top, 10) - this._dropdownMenuHeight - this.#dropdownMenuPadding
              - menuButton.offsetHeight - (2 * menuButtonSpacing)}px`;
          }

          // Change the opening animation to open from the bottom.
          dropdownMenu.classList.add('otc-animation-up');

          // Update the position of the menu.
          menuClientRect = this.getBoundingClientRect();
        }
      }
    }

    // If the dropdown is scrollable and it is still displayed off screen, restrict it's height even further so that it is displayed
    // entirely on screen.
    if (this.scrollable) {
      menuClientRect = dropdownMenu.getBoundingClientRect();
      const menuButtonClientRect = menuButton.getBoundingClientRect();

      // Determine if the dropdown is opening up.
      const openingUp = menuClientRect.top < menuButtonClientRect.top;
      if (openingUp) {
        // Calculate the current top of the dropdown.  We need to calculate it because the animation is not yet finished.  We know that the
        // animation starts at 50% height and grows to 100% height, so we need to double the current height value in order to determine the
        // height once the animation has finished.
        const calculatedTop = menuClientRect.bottom - 2 * menuClientRect.height;

        // If the calculated top is less than 0, it will be displayed off screen.
        if (calculatedTop < 0) {
          // Subtract the calculated top from the current top so that we end up with a value that places the top of the dropdown menu right
          // at the top of the screen.
          const newTop = dropdownMenu.offsetTop - calculatedTop;
          // Add 4 pixels to the new top to account for the box-shadow around the dropdown menu.
          dropdownMenu.style.top = `${newTop + 5}px`;

          // Since we know that the new top of the dropdown menu is at 0, the new height of the dropdown menu should be equal the top of
          // the menu button.
          const newHeight = menuButtonClientRect.top;
          // Subtract 5 pixels from the new height to account for the box-shadow around the dropdown menu.
          this.#partRefs.itemsWrapper.value.style.maxHeight = `${newHeight - 5}px`;
        }
      } else if (calculatedBottom > boundingEdges.boundingBottom) {
        // Calculate the new height.  First subtract the top of the dropdown menu our bounding bottom dimension.  Next, subtract the height
        // of the actions wrapper, since it does not scroll.  Also, since we are using `content-box` sizing and getBoundingClientRect
        // returns the `border-box` size, we need to manually subtract the top and bottom padding.  Finally, we need to subtract the size of
        // the box-shadow.  There is no easy way to determine this from Javascript, so we will just hard-code a reasonable value.
        const actionsWrapperHeight = this.#partRefs.actionsWrapper.value?.clientHeight ?? 0;
        const newHeight = boundingEdges.boundingBottom - menuClientRect.top - actionsWrapperHeight - this.#dropdownMenuPadding - 8;
        this.#partRefs.itemsWrapper.value.style.maxHeight = `${newHeight}px`;
      }
    }
  }

  #getItemsTemplate() {
    const itemsWrapperClasses = {
      'ot-dropdown__items-wrapper': true,
      'ot-dropdown__items-wrapper--should-scroll': this.scrollable,
      'ot-scrollbar': true,
    };

    return html`<div ${n(this.#partRefs.itemsWrapper)} class="${e$1(itemsWrapperClasses)}"><slot ${n(this.#partRefs.slot)} @slotchange="${this.#handleSlotChange}"><otc-menuplaceholder></otc-menuplaceholder></slot></div>`;
  }

  #getActionsTemplate() {
    const actionsDividerClasses = {
      'ot--is-hidden': !this.clearAll && !this._showShowMoreItem,
    };

    const actionsWrapperClasses = {
      'ot-dropdown__actions-wrapper': true,
      'ot--is-hidden': !this.clearAll && !this._showShowMoreItem,
    };

    const clearAllClasses = {
      'ot--is-hidden': !this.clearAll,
    };

    const showMoreItemClasses = {
      'ot--is-hidden': !this._showShowMoreItem,
    };

    return html`<otc-menudivider class="${e$1(actionsDividerClasses)}"></otc-menudivider><div class="${e$1(actionsWrapperClasses)}" ${n(this.#partRefs.actionsWrapper)}><otc-button id="${this.#clearAllItemId}" class="${e$1(clearAllClasses)}" type="secondary" size="mini" ${n(this.#partRefs.clearAllItem)} @click="${this.#handleClearAllClick}" @keydown="${this.#handleClearAllKeyDown}">${this.clearAllText}</otc-button><otc-button id="${this.#showMoreItemId}" class="${e$1(showMoreItemClasses)}" type="secondary" size="mini" ${n(this.#partRefs.showMoreItem)} @click="${this.#handleShowMoreClick}" @keydown="${this.#handleShowMoreKeyDown}"><span class="ot-dropdown__action-item-trigger">${this.showMoreText}</span> <span class="ot-dropdown__caret-down-icon ot-dropdown__action-item-trigger"></span></otc-button></div>`;
  }

  render() {
    const dropdownClasses = {
      'ot-dropdown': true,
      'ot-dropdown--is-active': this.isOpen,
      'ot-dropdown--is-right': this.#rtlController.isRTL,
      'ot-dropdown--is-header-searchfield': this.isSearch,
    };

    const dropdownMenuClasses = {
      'ot-dropdown__menu': true,
      'otc-animation-up': this.forceOpenUp,
    };

    const dropdownMenuStyles = {
      height: `${(this._dropdownMenuHeight > 0) ? `${this._dropdownMenuHeight}px` : 'unset'}`,
    };

    return html`<div ${n(this.#partRefs.dropdown)} class="${e$1(dropdownClasses)}"><ul ${n(this.#partRefs.dropdownMenu)} class="${e$1(dropdownMenuClasses)}" role="${this.ariaRole === 'listbox' ? 'listbox' : 'menu'}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" style="${o(dropdownMenuStyles)}"><div ${n(this.#partRefs.animationWrapper)} class="ot-dropdown__animation-wrapper">${this.#getItemsTemplate()} ${this.#getActionsTemplate()}</div></ul></div>`;
  }
}

customElements.define('otc-menu', OtcMenu);

export { OtcMenu };
//# sourceMappingURL=otcMenu.js.map
