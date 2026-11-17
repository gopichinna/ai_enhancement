/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import otcMenuStyles from './otcMenu.scss.js';
import { flattenElementArray, isChild, triggerEvent, getViewportHeight, getViewportWidth } from '../../utilities/common-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { ThemeController } from '../../controllers/themeController.js';
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
 * @prop {boolean} disableAnimation Prevent the default menu animations from running.
 * @prop {boolean} disablePlaceholder Prevent the default menu placeholder from being shown with an empty menu.
 * @prop {boolean} forceOpenDown Force the menu to always open down.
 * **Note:** setting this property bypasses the logic that repositions the menu if it would appear off screen.
 * @prop {boolean} forceOpenUp Force the menu to always open up.
 * **Note:** setting this property bypasses the logic that repositions the menu if it would appear off screen.
 * @prop {boolean} isOpen The open state of the menu dropdown.
 * @prop {boolean} isSearch Defines if menu is being used in the context of the header bar search.
 * @prop {boolean} isSelect Defines if menu is being used as the dropdown of an `otc-select`.
 * @prop {boolean} isSubmenu Defines if menu is being used as the dropdown of a submenu item.
 * @prop {boolean} isWide Defines if menu should use the full width of the container.
 * @prop {number} maxItems The number of items to display initially.
 * Items after this will be hidden and a "Show More" item will be displayed automatically to allow them to be displayed.
 * @prop {boolean} scrollable Determines if the menu dropdown should be limited to the height of the viewport with an added scrollbar.
 * @prop {string} showMoreText Overrides the default "Show more" text.
 * @prop {boolean} usePopover Uses the Popover API to display the menu.
 * **Note: ** This property only works when the `buttonId` property is also specified.
 * @slot unnamed Defines the content of the menu.
 * **Note: ** It is strongly recommended that you only use `otc-menucheckbox`, `otc-menudivider`, `otc-menugroup`, `otc-menuitem`,
 * `otc-menuradio`, or `otc-submenu` components in order to preserve the intended design.
 * @fires change Fired when the checked value of an `otc-menucheckbox` is changed.
 * @fires clear-all **DEPRECATED:** Fired when the "Clear all" menu action item is clicked.
 * @fires clearAll Fired when the "Clear all" menu action item is clicked.
 * @fires close Fired when the menu gets closed.
 * @fires item-click **DEPRECATED:** Fired when an `otc-menuitem` is activated through either the mouse or keyboard.
 * @fires itemClick Fired when an `otc-menuitem` is activated through either the mouse or keyboard.
 * @fires item-remove **DEPRECATED:** Fired when attempting to remove an `otc-menuitem` with the `isDeletable` property.
 * @fires itemRemove Fired when attempting to remove an `otc-menuitem` with the `isDeletable` property.
 * @fires open Fired when the animation of the main menu has finished.
 */
class OtcMenu extends ElementBase {
  #rtlController = new RTLController(this);

  #themeController = new ThemeController(this);

  #boundDocumentClickHandler = this.#handleDocumentClick.bind(this);

  #boundDocumentScrollHandler = this.#handleDocumentScroll.bind(this);

  #boundWindowResizeHandler = this.#handleWindowResize.bind(this);

  #boundButtonClickHandler = this.#handleButtonClick.bind(this);

  #boundButtonKeyDownHandler = this.#handleButtonKeyDown.bind(this);

  #animationWrapperResizeObserver = new ResizeObserver(this.#handleAnimationWrapperResize.bind(this));

  #submenuMutationObserver = new MutationObserver(this.#handleSubmenuMutation.bind(this));

  // The calculated gap between menu items.  This is used when restricting the height of the dropdown menu through the `maxItems` or
  // `scrollable` properties.
  #menuItemGap = 0;

  #menuReservedVerticalSpace = 32;

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
      otcMenuStyles,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: { type: String, reflect: true },
      ariaRole: { type: String, reflect: true },
      buttonAlignment: { type: String, reflect: true },
      buttonId: { type: String, reflect: true },
      clearAll: { type: Boolean, reflect: true },
      clearAllText: { type: String, reflect: true },
      disableAnimation: { type: Boolean, reflect: true },
      disablePlaceholder: { type: Boolean, reflect: true },
      forceOpenDown: { type: Boolean, reflect: true },
      forceOpenUp: { type: Boolean, reflect: true },
      isOpen: { type: Boolean, reflect: true },
      isSearch: { type: Boolean, reflect: true },
      isSelect: { type: Boolean, reflect: true },
      isSubmenu: { type: Boolean, reflect: true },
      isWide: { type: Boolean, reflect: true },
      maxItems: { type: Number, reflect: true },
      scrollable: { type: Boolean, reflect: true },
      showMoreText: { type: String, reflect: true },
      usePopover: { type: Boolean, reflect: true },
      _dropdownMenuHeight: { state: true },
      _showShowMoreItem: { state: true },
    };

    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.ariaRole = 'menu';
    this.ariaLabel = '';
    this.buttonAlignment = 'start';
    this.buttonId = '';
    this.clearAll = false;
    this.clearAllText = 'Clear all';
    this.disableAnimation = false;
    this.disablePlaceholder = false;
    this.forceOpenDown = false;
    this.forceOpenUp = false;
    this.isOpen = false;
    this.isSearch = false;
    this.isSelect = false;
    this.isSubmenu = false;
    this.isWide = false;
    this.maxItems = 0;
    this.scrollable = false;
    this.showMoreText = 'Show more';
    this.usePopover = false;

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

    // Determine the menu item gap.
    const itemsWrapper = this.#partRefs.itemsWrapper.value;
    this.#menuItemGap = parseInt(getComputedStyle(itemsWrapper).gap, 10);

    // Add a resize observer to the animation wrapper so that we can sync the dropdown menu with its size.
    this.#animationWrapperResizeObserver.observe(this.#partRefs.animationWrapper.value);

    // Add the document click handler so that we can listen for the escape key to close the menu.
    document.addEventListener('click', this.#boundDocumentClickHandler);

    // Add a scroll handler so that we can reposition a Popover menu since it is position fixed and doesn't scroll with the page.
    this.ownerDocument.documentElement.addEventListener('scroll', this.#boundDocumentScrollHandler, true);

    // Add a window resize handler that will reposition the menu in relation to the changing position of the button.
    window.addEventListener('resize', this.#boundWindowResizeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove any handlers that were added in connectedCallback().
    window.removeEventListener('resize', this.#boundWindowResizeHandler);
    this.ownerDocument.documentElement.removeEventListener('scroll', this.#boundDocumentScrollHandler, true);
    document.removeEventListener('click', this.#boundDocumentClickHandler);
    this.#animationWrapperResizeObserver.disconnect();
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('isOpen')) {
      // If isOpen, tell the menu items to start their animations, otherwise remove the animation to be prepared for next open.
      this.#startOrRemoveMenuItemAnimation();
      if (!this.isOpen) {
        // Close all submenus when the parent menu closes.
        this.#closeChildSubmenus();
      } else if (this.disablePlaceholder && (this.#slottedElements?.length === 0)) {
        // Don't open the menu when it is empty and the placeholder is disabled.
        this.isOpen = false;
      }
    }
  }

  firstUpdated(changedProperties) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen && this.disablePlaceholder && (this.#slottedElements?.length === 0)) {
        // Don't open the menu when it is empty and the placeholder is disabled.
        this.isOpen = false;
      }

      const submenus = this.getElementsByTagName('otc-submenu');
      for (const submenu of submenus) {
        submenu.updateComplete?.then(() => {
          submenu.requestUpdate();
        });
      }
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

    if (changedProperties.has('buttonId') && !this.isSubmenu) {
      // Remove the handlers from the old button, if it still exists.
      const oldButtonId = changedProperties.get('buttonId');
      const oldButtonElement = Array.from(document.querySelectorAll(`[id="${oldButtonId}"]`))
        .filter(e => !FocusUtilities.isHidden(e))?.at(0);
      this.#removeMenuButtonListeners(oldButtonElement);

      // Add the handlers to the new button.
      this.#addMenuButtonListeners();
    }

    if (changedProperties.has('isOpen')) {
      // Update the `menuOpen` property of our associated button.
      this.#setButtonMenuOpen();

      // Dispatch open and close events.
      if (!this.isOpen) {
        if (this.#shouldUsePopover()) {
          this.#partRefs.dropdown.value?.hidePopover();
        }

        // Only dispatch the close event when the menu is actually being closed.  Otherwise, we would be dispatching the event when the menu
        // was created.
        if (changedProperties.get('isOpen')) {
          // There is no close animation, so we can just dispatch the event immediately.
          const closeEvent = new CustomEvent('close', { bubbles: true, composed: true });
          this.dispatchEvent(closeEvent);
        }
      } else {
        if (this.#shouldUsePopover()) {
          this.#partRefs.dropdown.value?.showPopover();
        }

        // This event will only be dispatched when all animations on the dropdown element have finished.
        const dropdown = this.#partRefs.dropdown.value;
        const dropdownAnimationPromises = dropdown.getAnimations()?.map(animation => animation.finished);
        Promise.all(dropdownAnimationPromises ?? []).then(() => {
          const openEvent = new CustomEvent('open', { bubbles: true, composed: true });
          this.dispatchEvent(openEvent);
        });
      }
    }

    if (changedProperties.has('scrollable') && (changedProperties.get('scrollable') !== undefined)) {
      // The submenu renders using the Popover API when it's parent uses `scrollable`.  Close any open submenus when switching modes.
      const openSubmenus = Array.from(this.querySelectorAll('otc-submenu[isOpen]'));
      openSubmenus.forEach((submenu) => { submenu.isOpen = false; });
    }

    if (this.isOpen) {
      // Set the position of the dropdown relative to the button.
      this.#setMenuStyles();
    }
  }

  #addMenuButtonListeners() {
    if (!this.isSubmenu && this.#menuButton) {
      // First, remove any existing handlers to prevent duplicates.
      this.#removeMenuButtonListeners(this.#menuButton);

      // Add the handlers to the menu button.
      this.#menuButton.addEventListener('click', this.#boundButtonClickHandler);
      this.#menuButton.addEventListener('keydown', this.#boundButtonKeyDownHandler);
      this.#menuButton.setAttribute('aria-haspopup', 'menu');
      this.#menuButton.setAttribute('aria-expanded', this.isOpen);
      this.#menuButtonElement.menuOpen = this.isOpen;
    }
  }

  #removeMenuButtonListeners(menuButton) {
    if (!this.isSubmenu && menuButton) {
      // Remove the handlers from the menu button.
      menuButton.removeEventListener('click', this.#boundButtonClickHandler);
      menuButton.removeEventListener('keydown', this.#boundButtonKeyDownHandler);
      menuButton.removeAttribute('aria-haspopup');
      menuButton.removeAttribute('aria-expanded');
    }
  }

  #observeSubmenuIsOpen() {
    // Disconnect observer from all outdated elements.
    this.#submenuMutationObserver.disconnect();

    // Watch for changes to the `isOpen` property of any child submenu elements.
    const submenuChildren = flattenElementArray(this.#slottedElements).filter(x => x.matches('otc-submenu'));
    submenuChildren.forEach((submenu) => {
      this.#submenuMutationObserver.observe(submenu, { attributeFilter: ['isopen'] });
    });

    // Watch for changes to the `menuOpen` property of any child toolbaritem elements that have their own toolbaritem elements, since this
    // could be rendered as submenus if they are wrapped into the overflow menu.
    const toolbaritemChildren = flattenElementArray(this.#slottedElements).filter(x => x.matches('otc-toolbaritem:has(otc-toolbaritem)'));
    toolbaritemChildren.forEach((toolbaritem) => {
      this.#submenuMutationObserver.observe(toolbaritem, { attributeFilter: ['menuopen'] });
    });
  }

  #handleSubmenuMutation(records) {
    // Find the first record that represents a submenu opening.
    const justOpenedSubmenuRecord = records.find(record => record.target.matches('otc-submenu[isOpen], otc-toolbaritem[menuOpen]'));

    if (justOpenedSubmenuRecord) {
      // Determine if there are any open submenus other than the one that just opened.
      const submenusToClose = flattenElementArray(this.#slottedElements)
        .filter(el => el.matches('otc-submenu[isOpen], otc-toolbaritem[menuOpen]') && (el !== justOpenedSubmenuRecord.target));

      // Close any open submenus other than the one that just opened.
      submenusToClose.forEach((submenu) => {
        submenu.updateComplete?.then(() => {
          if (submenu.tagName === 'OTC-SUBMENU') {
            submenu.isOpen = false;
          }
          if (submenu.tagName === 'OTC-TOOLBARITEM') {
            submenu.menuOpen = false;
          }
        });
      });
    }
  }

  #setButtonMenuOpen() {
    const menuButtonElement = this.#menuButtonElement;
    if (menuButtonElement) {
      // By default, we will assume that the menu button element will have the `aria-expanded` property on the element itself.
      let ariaExpandedElement = menuButtonElement;

      // If it is one of our web components, we want the `aria-expanded` property to be on a shadow root elements instead.  Check for a
      // pre-existing `aria-expanded` property somewhere in the shadow root..
      if (!menuButtonElement.hasAttribute('aria-expanded')) {
        const shadowMenuButtonElementWithAriaExpanded = menuButtonElement.shadowRoot?.querySelector('*[aria-expanded]');
        if (shadowMenuButtonElementWithAriaExpanded) {
          // We should use the shadow button element instead since it has a pre-existing `aria-expanded` property.
          ariaExpandedElement = shadowMenuButtonElementWithAriaExpanded;
        }
      }

      // Set the `aria-expanded` attribute to match the open state of the menu.
      ariaExpandedElement.ariaExpanded = this.isOpen;

      if (menuButtonElement.menuOpen != null) {
        // If the menu button element has a 'menuOpen' attribute, e.g. it is one of our web components, then set 'menuOpen'.  The web
        // component will set 'aria-expanded' on the proper element in the shadow root itself during re-renders.  We need to take this
        // seemingly redundant approach because if we only set `menuOpen`, the rendering lifecycle would take too long to update
        // `aria-expanded` and the screen reader would still read the old state of the button when the menu is first closed.
        menuButtonElement.menuOpen = this.isOpen;
      } else {
        // If the menu button is the child of an `otc-select` element, then we want to set `menuOpen` on the `otc-select` component, not the
        // menu button.
        const menuButtonElementHost = menuButtonElement.getRootNode()?.host;
        if (menuButtonElementHost && this.isSelect) {
          menuButtonElementHost.menuOpen = this.isOpen;
        }
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
        let rootNode = this.getRootNode();
        while (!menuButtonElement && rootNode) {
          menuButtonElement = rootNode.querySelector(`#${this.buttonId}`) ?? rootNode.host?.querySelector(`#${this.buttonId}`);
          rootNode = rootNode.host?.getRootNode();
        }
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

  // The overlap of the submenu on its parent.
  get #submenuOverlap() {
    if (this._themeIsCarbonFiber) {
      return 4;
    }

    return 3;
  }

  // The padding on the dropdown menu.  This is used when restricting the height of the dropdown menu through the `maxItems` or `scrollable`
  // properties.
  get #dropdownMenuPaddingBlock() {
    const dropdownMenu = this.#partRefs.dropdownMenu.value;
    if (dropdownMenu) {
      const dropdownMenuPadding = parseInt(window.getComputedStyle(dropdownMenu).paddingBlockStart, 10)
      + parseInt(window.getComputedStyle(dropdownMenu).paddingBlockEnd, 10);

      return dropdownMenuPadding;
    }

    return 0;
  }

  // The padding on the animation wrapper.  This is used when restricting the height of the dropdown menu through the `maxItems` or
  // `scrollable` properties.
  get #animationWrapperPaddingBlock() {
    const animationWrapper = this.#partRefs.animationWrapper.value;
    if (animationWrapper) {
      const animationWrapperPadding = parseInt(window.getComputedStyle(animationWrapper).paddingBlockStart, 10)
      + parseInt(window.getComputedStyle(animationWrapper).paddingBlockEnd, 10);

      return animationWrapperPadding;
    }

    return 0;
  }

  // The border on the dropdown menu.  This is used when restricting the height of the dropdown menu through the `maxItems` or `scrollable`
  // properties.
  get #animationWrapperBorderBlock() {
    const animationWrapper = this.#partRefs.animationWrapper.value;
    if (animationWrapper) {
      const animationWrapperBorder = parseInt(window.getComputedStyle(animationWrapper).borderBlockStartWidth, 10)
      + parseInt(window.getComputedStyle(animationWrapper).borderBlockEndWidth, 10);

      return animationWrapperBorder;
    }

    return 0;
  }

  // The length of the box-shadow below the dropdown menu.  This is used when restricting the height of the dropdown menu through the
  // `maxItems` or `scrollable` properties.
  get #animationWrapperBoxShadowLength() {
    if (this._themeIsCarbonFiber) {
      return 5;
    }

    return 12;
  }

  /* Returns a promise that resolves when all dropdown menu animations have finished.
   * @returns {Promise}
   * @internal
   */
  get #dropdownMenuAnimationPromise() {
    const dropdownMenu = this.#partRefs.dropdownMenu.value;
    const dropdownMenuAnimationPromises = dropdownMenu.getAnimations()?.map(animation => animation.finished);
    return Promise.allSettled(dropdownMenuAnimationPromises ?? []);
  }

  #shouldUsePopover() {
    return (this.usePopover && (this.buttonId.length > 0));
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
    triggerEvent(this, CustomEvent, 'clear-all');
    triggerEvent(this, CustomEvent, 'clearAll'); // #3599171
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

  #handleDocumentClick(event) {
    if (this.isOpen && !this.isSearch) {
      const newTarget = event.composedPath()[0] ?? event.target;
      if (!newTarget) {
        // If we don't know the new target, close the menu.
        this.isOpen = false;
      }

      // Don't close the menu if the click is on the menu or any of it's children.
      if (event.composedPath().some(el => el === this)) {
        return;
      }

      // Check if the menu button was clicked (or any child, even if it is in any shadow-dom) and don't close the menu if yes.
      //
      // We can't just use `event.target` because of cases like the overflow menu in `otc-toolbar`.  In that case, the overflow menu button
      // is in the shadow root of the toolbar and will generate a click event that is re-targeted to the `otc-toolbar` itself.  If we were
      // to use `event.target`, there is no way to differentiate between an actual click somewhere else on the toolbar and the re-targeted
      // event when clicking on the overflow menu button.
      //
      const isButtonChild = this.#menuButtonElement && event.composedPath().some(el => el === this.#menuButtonElement);
      if (isButtonChild) {
        return; // don't close the menu, because it was a click to the menu-button
      }

      // Check if we are associated with an `otc-select` element.  Any click inside our associated `otc-select` should not close the menu.
      // The `otc-select` will handle closing the menu itself, as necessary.
      const parentSelect = this.getRootNode()?.host;
      const eventSelect = event.composedPath().find(el => el.tagName === 'OTC-SELECT');
      if (this.isSelect && (parentSelect === eventSelect)) {
        return;
      }

      // not clicked at menu nor at the button => close the menu
      this.isOpen = false;
    }
  }

  #handleDocumentScroll() {
    // Reset the scroll height since the position of the menu relative to the viewport changed.
    this.#resetScrollableHeight();

    // Set the position of the dropdown relative to the new position of the button.
    this.#setMenuStyles();
  }

  #handleWindowResize() {
    // Reset the scroll height since the size of the viewport changed.
    this.#resetScrollableHeight();

    // Set the position of the dropdown relative to the button.
    this.#setMenuStyles();
  }

  #isMenuActionItemFocused() {
    if (this === document.activeElement) {
      const shadowActiveElement = document.activeElement.shadowRoot.activeElement;
      if ((shadowActiveElement === this.#partRefs.clearAllItem.value) || (shadowActiveElement === this.#partRefs.showMoreItem.value)) {
        return true;
      }
    }

    return false;
  }

  #closeChildSubmenus() {
    const submenus = flattenElementArray(this.#slottedElements).filter(element => element.matches('otc-submenu[isopen]'));
    submenus.forEach((submenu) => {
      submenu.updateComplete?.then(() => {
        submenu.isOpen = false;
      });
    });
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

          // Close child submenus.
          this.#closeChildSubmenus();

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

        // Find the last unhidden element before the "Clear all" item or "Show more" item.
        const menuItems = flattenElementArray(this.#slottedElements);
        const lastElement = menuItems.findLast(e => e.style.getPropertyValue('display') !== 'none');

        if (lastElement === event.target) {
          // Focus the "Clear all" item or "Show more" item.
          if (this.clearAll) {
            FocusUtilities.focusElement(this.#partRefs.clearAllItem.value);
          } else if (this._showShowMoreItem) {
            FocusUtilities.focusElement(this.#partRefs.showMoreItem.value);
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
          // Check to see if we are trying to Tab to either the "Clear all" or "Show more" buttons from one of the menu items.
          if (!this.#isMenuActionItemFocused() && !event.shiftKey) {
            if (this.clearAll) {
              // Focus the "Clear all" button and prevent normal tab navigation.
              FocusUtilities.focusElement(this.#partRefs.clearAllItem.value);
              event.preventDefault();
            } else if (this._showShowMoreItem) {
              // Focus the "Show more" button and prevent normal tab navigation.
              FocusUtilities.focusElement(this.#partRefs.showMoreItem.value);
              event.preventDefault();
            } else {
              // Neither the "Clear all" or the "Show more" buttons are visible, so we must be changing focus to an element outside of the
              // menu.  We should close the menu.
              this.isOpen = false;
            }
          } else {
            // We must be changing focus to an element outside of the menu so we should close the menu.
            this.isOpen = false;
          }
        }
        break;

      // no default
    }
  }

  #handleButtonKeyDown(event) {
    if (event.target?.readonly) {
      return;
    }

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
    // Reset the state of the "Show more" item.
    this.#resetShowMoreState();

    // Reset the height restriction from the scrollable property.
    this.#resetScrollableHeight();

    // Start the animation on the menu items.
    this.#startOrRemoveMenuItemAnimation();

    // Watch for submenus opening.
    this.#observeSubmenuIsOpen();
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
    const itemsWrapper = this.#partRefs.itemsWrapper.value;
    if (!itemsWrapper) {
      return;
    }

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
      itemsWrapper.style.maxHeight = `${shownItemsHeight}px`;
    } else if (this.scrollable && this.isSearch) {
      this.#dropdownMenuAnimationPromise.then(() => {
        // First, reset any previous max height restriction.
        itemsWrapper.style.maxHeight = '';

        // Now, check to see if the bottom of the menu dropdown is outside of the viewport.
        const itemsWrapperRect = itemsWrapper.getBoundingClientRect();
        const menuRealBottom = itemsWrapperRect.bottom + this.#dropdownMenuPaddingBlock + this.#animationWrapperPaddingBlock
          + this.#animationWrapperBorderBlock + this.#animationWrapperBoxShadowLength;
        const viewportHeight = getViewportHeight();
        if (menuRealBottom > viewportHeight) {
          // Restrict the max height of the menu dropdown so that it fits within the viewport.
          itemsWrapper.style.maxHeight = `${viewportHeight - itemsWrapperRect.top
            - this.#dropdownMenuPaddingBlock - this.#animationWrapperPaddingBlock - this.#animationWrapperBorderBlock
            - this.#animationWrapperBoxShadowLength}px`;
        }
      });
    } else if (this.#partRefs.dropdownMenu.value) {
      // Reset the max height of the menu dropdown.
      itemsWrapper.style.maxHeight = 'unset';
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

    if (this.isSelect) {
      // If we are associated with an 'otc-select' element, we want to position ourselves relative to the inner combobox.
      menuButton = menuButton.shadowRoot.getElementById('select-input');
      if (!menuButton) {
        return;
      }
    }

    // Clear the animation class, if it was previously added by our menu repositioning as opposed to being added by a property.
    if (!this.forceOpenUp) {
      dropdownMenu.classList.remove('otc-animation-up');
    }

    // Move the menu component so that it is below and aligned with the left of the button.  All other positioning is calculated as an
    // offset of this position and applied to the dropdown menu.
    this.#setInitialMenuPosition(menuButton);

    // Reposition the menu component if it is opened off screen.
    this.#repositionOffScreenMenu(menuButton);

    // Move the popover to the absolute position of the menu component.
    this.#repositionPopover();
  }

  #setInitialMenuPosition(menuButton) {
    // Get the position of the button.
    const buttonClientRect = menuButton.getBoundingClientRect();

    const dropdownMenu = this.#partRefs.dropdownMenu.value;

    // Get the position of the menu at 0,0.  If we are constrained by an ancestors stacking context, this will not be 0,0 of the
    // viewport.
    this.style.left = 0;
    this.style.top = 0;
    const menuClientRect = this.getBoundingClientRect();

    if (this.isSubmenu) {
      if (this._themeIsCarbonFiber) {
        // The top of the submenu should be equal with the top of the button.
        this.style.top = `${buttonClientRect.y - menuClientRect.y}px`;
      } else {
        // The top of the submenu should offset above the top of button.
        this.style.top = `${buttonClientRect.y - menuClientRect.y - this.#submenuOverlap}px`;
      }

      if (this.#rtlController.isRTL) {
        if (this.#shouldUsePopover()) {
          // The right edge of the submenu should be in line with the left edge of the button, plus the specified overlap.
          this.style.left = `${buttonClientRect.x - menuClientRect.x + this.#submenuOverlap}px`;
        } else {
          // The right edge of the submenu should be in line with the left edge of the button, plus the specified overlap.
          this.style.left = `${buttonClientRect.x - (menuClientRect.x + dropdownMenu.clientWidth) + this.#submenuOverlap}px`;
        }
      } else {
        // The left edge of the submenu should be in line with the right edge of the button, minus the specified overlap.
        this.style.left = `${buttonClientRect.right - menuClientRect.x - this.#submenuOverlap}px`;
      }
    } else {
      if (this.forceOpenUp) {
        // The bottom of the menu should be just above the top of the button.
        this.style.top = `${(buttonClientRect.y - menuClientRect.y) - this._dropdownMenuHeight - this.#dropdownMenuPaddingBlock}px`;
      } else {
        // The top of the menu should be just under the bottom of the button.
        this.style.top = `${(buttonClientRect.y - menuClientRect.y) + buttonClientRect.height}px`;
      }

      if (this.#rtlController.isRTL) {
        if ((this.buttonAlignment === 'left') || (this.buttonAlignment === 'end')) {
        // The left edge of the menu should be in line with the left edge of the button.
          this.style.left = `${(buttonClientRect.x - menuClientRect.x)}px`;
        } else if (this.#shouldUsePopover()) {
          this.style.left = `${(buttonClientRect.x - menuClientRect.x) + buttonClientRect.width}px`;
        } else {
          // The right edge of the menu should be in line with the right edge of the button.
          this.style.left = `${(buttonClientRect.x - menuClientRect.x) + buttonClientRect.width - dropdownMenu.clientWidth}px`;
        }
      } else if ((this.buttonAlignment === 'right') || (this.buttonAlignment === 'end')) {
        // The right edge of the menu should be in line with the right edge of the button.
        this.style.left = `${(buttonClientRect.x - menuClientRect.x) + buttonClientRect.width - dropdownMenu.clientWidth}px`;
      } else {
        // The left edge of the menu should be in line with the left edge of the button.
        this.style.left = `${buttonClientRect.x - menuClientRect.x}px`;
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

  #repositionOffScreenMenu(menuButton) {
    const boundingEdges = this.#getBoundingEdges();
    const boundingBottom = this.#shouldUsePopover() ? getViewportHeight() : boundingEdges.boundingBottom;
    const boundingLeft = this.#shouldUsePopover() ? 0 : boundingEdges.boundingLeft;
    const boundingRight = this.#shouldUsePopover() ? getViewportWidth() : boundingEdges.boundingRight;
    const boundingTop = this.#shouldUsePopover() ? 0 : boundingEdges.boundingTop;

    const dropdownMenu = this.#partRefs.dropdownMenu.value;

    // Check to see if the left edge of the dropdown is outside of the viewport or the bounding ancestor element.
    let menuLeft = this.getBoundingClientRect().x;
    if (this.#rtlController.isRTL && this.#shouldUsePopover()) {
      // When using popover in RTL mode, the x coordinate will be the right edge of the menu.
      menuLeft = this.getBoundingClientRect().x - dropdownMenu.clientWidth;
    }

    if (menuLeft < boundingLeft) {
      if (this.isSubmenu) {
        if (this.#shouldUsePopover()) {
          this.style.left = `${menuButton.getBoundingClientRect().width + dropdownMenu.clientWidth - this.#submenuOverlap}px`;
        } else {
          this.style.left = `${dropdownMenu.clientWidth - this.#submenuOverlap}px`;
        }
      } else {
        // Set the left edge of the dropdown to match that of the button.
        this.style.left = `${parseInt(getComputedStyle(this).left, 10) + dropdownMenu.clientWidth
          - menuButton.getBoundingClientRect().width}px`;
      }
    }

    // Check to see if the right edge of the dropdown is outside of the viewport or the bounding ancestor element.
    let menuRight = this.getBoundingClientRect().x + dropdownMenu.clientWidth;
    if (this.#rtlController.isRTL && this.#shouldUsePopover()) {
      // When using popover in RTL mode, the x coordinate will be the right edge of the menu.
      menuRight = this.getBoundingClientRect().x;
    }

    if (menuRight > boundingRight) {
      if (this.isSubmenu) {
        this.style.left = `-${dropdownMenu.clientWidth - this.#submenuOverlap}px`;
      } else {
        // Position the dropdown so that the right edge matches the right edge of the button.
        this.style.left = `${parseInt(getComputedStyle(this).left, 10) - dropdownMenu.clientWidth
          + menuButton.getBoundingClientRect().width}px`;
      }
    }

    const calculatedBottom = this.getBoundingClientRect().y + this._dropdownMenuHeight;

    // Only check the bottom of the dropdown if we are not being forced in a certain direction.
    if (!this.forceOpenDown && !this.forceOpenUp) {
      // Check to see if the bottom of the dropdown is outside of the viewport.
      if (calculatedBottom > boundingBottom) {
        const menuTop = menuButton.getBoundingClientRect().y;

        // Check to see if we have room to open the menu up instead.
        const calculatedBottomOpeningUp = menuTop - this._dropdownMenuHeight;
        const canOpenUp = calculatedBottomOpeningUp > boundingTop;

        // If we don't have room to open the menu in either direction, check to see which direction has more room to open.  If we have more
        // space above, we will still open up.
        const moreSpaceAbove = (menuTop - boundingTop) > (boundingBottom - menuTop);

        if (canOpenUp || moreSpaceAbove) {
          if (this.isSubmenu) {
            // Offset the top of the menu by subtracting its height and its padding from the origin point.  This would place it above the
            // submenu item, so we need to add back the height of the submenu item.
            this.style.top = `${0 - this._dropdownMenuHeight - this.#dropdownMenuPaddingBlock + menuButton.offsetHeight}px`;
          } else {
            // Offset the top of the menu from its current position by subtracting its height, its padding, the height of the button, and
            // twice the height of the menu button spacing, since we want to negate the current spacing below the button and add it to the
            // top of the button.
            this.style.top = `${parseInt(this.style.top, 10) - this._dropdownMenuHeight - this.#dropdownMenuPaddingBlock
              - menuButton.offsetHeight}px`;
          }

          // Change the opening animation to open from the bottom.
          dropdownMenu.classList.add('otc-animation-up');
        }
      }
    }

    // If the dropdown is scrollable and it is still displayed off screen, restrict it's height even further so that it is displayed
    // entirely on screen.
    if (this.scrollable) {
      // Determine if the dropdown is opening up.
      let openingUp = false;
      if (this.isSubmenu && !this._themeIsCarbonFiber) {
        // JATO offsets the submenu dropdown above the submenu item, so we need to include it in order to determine the open direction.
        openingUp = (this.getBoundingClientRect().y + this.#submenuOverlap) < menuButton.getBoundingClientRect().y;
      } else {
        openingUp = this.getBoundingClientRect().y < menuButton.getBoundingClientRect().y;
      }

      if (openingUp) {
        if (this.getBoundingClientRect().y < boundingTop) {
          // We need to set the top of the menu the top of our bounding top dimension, plus the reserved space.
          const newTop = boundingTop + this.#menuReservedVerticalSpace;

          // We will need to reduce the height of the menu by the difference between it's current top dimension and the new top dimension.
          const heightReduction = boundingTop + this.#menuReservedVerticalSpace - this.getBoundingClientRect().y;
          this.#partRefs.itemsWrapper.value.style.maxHeight = `${this._dropdownMenuHeight - heightReduction}px`;

          this.style.top = `${newTop}px`;
        }
      } else if (calculatedBottom > boundingBottom) {
        // Calculate the new height.  First subtract the top of the dropdown menu our bounding bottom dimension.  Next, subtract the height
        // of the actions wrapper, since it does not scroll.  Also, since we are using `content-box` sizing and getBoundingClientRect
        // returns the `border-box` size, we need to manually subtract the top and bottom padding.
        const actionsWrapperHeight = this.#partRefs.actionsWrapper.value?.clientHeight ?? 0;
        const newHeight = boundingBottom - this.getBoundingClientRect().y - actionsWrapperHeight - this.#dropdownMenuPaddingBlock;

        // When restricting the height of the menu, it should not be within 32 pixels of the screen
        this.#partRefs.itemsWrapper.value.style.maxHeight = `${newHeight - this.#menuReservedVerticalSpace}px`;
      }
    }
  }

  #repositionPopover() {
    if (!this.#shouldUsePopover()) {
      return;
    }

    const menuClientRect = this.getBoundingClientRect();
    this.style.setProperty('--jatx-otc-menu-popover-top', `${menuClientRect.top}px`);
    if (this.#rtlController.isRTL) {
      this.style.setProperty('--jatx-otc-menu-popover-left', `${menuClientRect.right}px`);
    } else {
      this.style.setProperty('--jatx-otc-menu-popover-left', `${menuClientRect.left}px`);
    }
  }

  #handleTransitionStart() {
    const dropdownMenu = this.#partRefs.dropdownMenu.value;

    // Hide the overflow while the transition animation is running.  The transition animation relies on the overflow being hidden for a
    // smooth transition.  We can't set the `overflow` to `hidden` permanently because it would hide the submenu.  The submenu should not be
    // shown whenever the menu is opening, so we are safe to hide while the transition is running.
    dropdownMenu.style.overflow = 'hidden';
  }

  #handleTransitionEnd() {
    const dropdownMenu = this.#partRefs.dropdownMenu.value;

    // Show the overflow again now that the transition animation is finished.
    dropdownMenu.style.overflow = 'revert';
  }

  #startOrRemoveMenuItemAnimation() {
    if (!this.disableAnimation) {
      // Notify all children that they should update, so that the animation class can be properly applied.
      const menuItems = flattenElementArray(this.#slottedElements, true);
      menuItems.forEach((item) => { item._showAnimation = this.isOpen; });
    }
  }

  #getItemsTemplate() {
    const itemsWrapperClasses = {
      'ot-dropdown__items-wrapper': true,
      'ot-dropdown__items-wrapper--should-scroll': this.scrollable,
      'ot-scrollbar': true,
    };

    return html`<div ${n(this.#partRefs.itemsWrapper)} class="${e$1(itemsWrapperClasses)}"><slot ${n(this.#partRefs.slot)} @slotchange="${this.#handleSlotChange}">${this.disablePlaceholder ? nothing : html`<otc-menuplaceholder></otc-menuplaceholder>`}</slot></div>`;
  }

  #getClearAllItemTemplate() {
    if (this.clearAll) {
      return html`<otc-menuactionitem id="otc-clearall-item" ${n(this.#partRefs.clearAllItem)} @click="${this.#handleClearAllClick}" @keydown="${this.#handleClearAllKeyDown}">${this.clearAllText}</otc-menuactionitem>`;
    }

    return nothing;
  }

  #getShowMoreItemTemplate() {
    if (this._showShowMoreItem) {
      return html`<otc-menuactionitem id="otc-showmore-item" ${n(this.#partRefs.showMoreItem)} @click="${this.#handleShowMoreClick}" @keydown="${this.#handleShowMoreKeyDown}">${this.showMoreText}</otc-menuactionitem>`;
    }

    return nothing;
  }

  #getActionsTemplate() {
    if (this.clearAll || this._showShowMoreItem) {
      return html`<otc-menudivider></otc-menudivider><div class="ot-dropdown__actions-wrapper" ${n(this.#partRefs.actionsWrapper)}>${this.#getClearAllItemTemplate()} ${this.#getShowMoreItemTemplate()}</div>`;
    }

    return nothing;
  }

  render() {
    const dropdownClasses = {
      'ot-dropdown': true,
      'ot-dropdown--is-active': this.isOpen,
      'ot-dropdown--is-header-searchfield': this.isSearch,
    };

    const dropdownMenuClasses = {
      'ot-dropdown__menu': true,
      'otc-animation-up': this.forceOpenUp,
      'otc-animation-disabled': this.disableAnimation,
    };

    const dropdownMenuStyles = {
      height: `${(this._dropdownMenuHeight > 0)
        ? `${this._dropdownMenuHeight + this.#dropdownMenuPaddingBlock + this.#animationWrapperBorderBlock}px`
        : 'unset'
      }`,
    };

    return html`<div ${n(this.#partRefs.dropdown)} class="${e$1(dropdownClasses)}" popover="${this.#shouldUsePopover() ? 'manual' : nothing}"><ul ${n(this.#partRefs.dropdownMenu)} class="${e$1(dropdownMenuClasses)}" role="${this.ariaRole === 'listbox' ? 'listbox' : 'menu'}" aria-label="${this.ariaLabel?.length > 0 ? this.ariaLabel : nothing}" style="${o(dropdownMenuStyles)}" @transitionstart="${this.#handleTransitionStart}" @transitionend="${this.#handleTransitionEnd}"><div ${n(this.#partRefs.animationWrapper)} class="ot-dropdown__animation-wrapper">${this.#getItemsTemplate()} ${this.#getActionsTemplate()}</div></ul></div>`;
  }
}

customElements.define('otc-menu', OtcMenu);

export { OtcMenu };
//# sourceMappingURL=otcMenu.js.map
