import { Console } from './logging-utilities.js';

class FocusUtilities {
  // Determine if the specified tagName matches an element for which we know can be focused.
  static isFocusableElement(element) {
    Console.log('isFocusableElement: ', element);

    // Non-existent elements are not focusable.
    if (!element) {
      Console.log('isFocusableElement: element is non-existent');
      return false;
    }

    // It is focusable if it is one of our focusable menu items.
    const otcComponentTags = [
      'otc-avatar[interactive]',
      'otc-menuactionitem',
      'otc-menucheckbox',
      'otc-menugroup',
      'otc-menuitem',
      'otc-menuradio',
      'otc-search-persistent',
      'otc-search-slidein',
      'otc-selectitem',
      'otc-selectuseritem',
      'otc-submenu',
      'otc-toolbaritem',
      'otc-widget-header-folder-title',
    ];
    if (element.matches(otcComponentTags.join(','))) {
      Console.log('isFocusableElement: element matches our component tags');
      return true;
    }

    // It is focusable if it is a standard focusable element. (https://api.jqueryui.com/focusable-selector/)
    if (element.matches('a[href], button, input, object, select, textarea, [tabindex]')) {
      Console.log('isFocusableElement: element matches standard focusable element');
      return true;
    }

    Console.log('isFocusableElement: element is not focusable');
    return false;
  }

  static isHidden(element) {
    if (!element) {
      return false;
    }

    // Check if the element is disabled or hidden.
    if (element.disabled || element.ariaHidden || (getComputedStyle(element).display === 'none')) {
      return true;
    }

    // Create a TreeWalker to find all of our ancestor elements.
    const rootElement = element.assignedSlot?.getRootNode() ?? element.getRootNode();
    const treeWalker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_ELEMENT,
      node => ((node.contains(element) || node.contains(element.assignedSlot)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    );

    // Check if any of our ancestor elements are hidden.
    while (treeWalker.nextNode()) {
      if (getComputedStyle(treeWalker.currentNode).display === 'none') {
        return true;
      }
    }

    return false;
  }

  /*
   * @param {Element} element
   * @param {Element with tabstop}
  */
  static focusElement(element, currentlyTabbableElement) {
    Console.log('focusElement: ', element);

    if (!element) {
      return;
    }

    let elementToFocus = element;

    if (element.shadowRoot) {
      switch (element.tagName) {
        case 'OTC-AVATAR':
          elementToFocus = element.shadowRoot.getElementById('avatar-button');
          break;

        case 'OTC-MENUACTIONITEM':
          elementToFocus = element.shadowRoot.getElementById('menuactionitem-dropdownitem');
          break;

        case 'OTC-MENUCHECKBOX':
          elementToFocus = element.shadowRoot.getElementById('menucheckbox-dropdownitem');
          break;

        case 'OTC-MENUITEM':
          elementToFocus = element.shadowRoot.getElementById('menuitem-dropdownitem');
          break;

        case 'OTC-MENURADIO':
          elementToFocus = element.shadowRoot.getElementById('menuradio-dropdownitem');
          break;

        case 'OTC-SEARCH-SLIDEIN':
          elementToFocus = element.shadowRoot.getElementById('otc-search-searchbutton-id');
          break;

        case 'OTC-SEARCH-PERSISTENT':
          elementToFocus = element.shadowRoot.getElementById('ot-search-input-id');
          break;

        case 'OTC-SELECTITEM':
          elementToFocus = element.shadowRoot.getElementById('selectitem-dropdownitem');
          break;

        case 'OTC-SELECTUSERITEM':
          elementToFocus = element.shadowRoot.getElementById('selectuseritem-dropdownitem');
          break;

        case 'OTC-SUBMENU':
          elementToFocus = element.shadowRoot.getElementById('submenu-dropdownitem');
          break;

        case 'OTC-TOOLBARITEM':
          // Focus on the web component element inside the `otc-toolbaritem`,
          this.focusElement(element.shadowRoot.getElementById('toolbaritem-element'));
          return;

        case 'OTC-WIDGET-HEADER-FOLDER-TITLE':
          elementToFocus = element.shadowRoot.getElementById('otc-folder-title-dropdown-button')
            ?? element.shadowRoot.getElementById('otc-folder-title-input');
          break;

        // no default
      }
    }

    if (elementToFocus) {
      Console.log('focusElement: focusing ', elementToFocus);
      if (currentlyTabbableElement && elementToFocus.hasAttribute('tabindex')) {
        elementToFocus.setAttribute('tabindex', '0');
      }
      elementToFocus.focus();
      if (currentlyTabbableElement && currentlyTabbableElement.hasAttribute('tabindex')) {
        currentlyTabbableElement.setAttribute('tabindex', '-1');
      }
    }
  }

  // Focus the first focusable dropdown item.
  static focusFirstItem(elements) {
    if (!elements) {
      return;
    }

    // If the first element is a slot, focus the first item in the slot.
    if (elements[0].tagName === 'SLOT') {
      this.focusFirstItem(elements[0].assignedElements({ flatten: true }));
    } else if (elements.length > 0) {
      const firstItem = elements.find(e => (this.isFocusableElement(e) && !this.isHidden(e)));

      if (firstItem) {
        if (firstItem.tagName === 'OTC-MENUGROUP') {
          // If the first focusable element is a menu group, focus the first item in the group.
          this.focusFirstItem(Array.from(firstItem.children));
        } else {
          this.focusElement(firstItem);
        }
      }
    }
  }

  // Find the previous focusable sibling from a given element
  static focusPreviousItem(startingElement, moveTabIndex) {
    Console.log('focusPreviousItem: Starting from: ', startingElement);

    if (!startingElement) {
      return;
    }

    let previousElement = startingElement.previousElementSibling;
    if (previousElement && previousElement.slot !== startingElement.slot) {
      return; // previousElementSibling is not in same slot -> assume navigation should not jump into different slot
    }

    // Iterate until we find the previous element that matches a specified tag.
    while (!!previousElement && !this.isFocusableElement(previousElement) && !this.isHidden(previousElement)) {
      if (previousElement.tagName === 'SLOT') {
        // If the previousElement is a slot, try to focus the last element in the slot.
        previousElement = previousElement.assignedElements().at(-1);
      } else if (!previousElement.previousElementSibling && !!previousElement.assignedSlot) {
        // If we are about to run out of sibling elements and the previous item is in a slot, we should continue with the previous sibling
        // of the slot.
        previousElement = previousElement.assignedSlot.previousElementSibling;
      } else {
        previousElement = previousElement.previousElementSibling;
      }
    }

    if (previousElement) {
      if (previousElement.tagName === 'OTC-MENUGROUP') {
        // If the previous focusable element is a menu group, focus the last item in the group.
        this.focusFirstItem(Array.from(previousElement.children).reverse());
      } else {
        this.focusElement(previousElement, moveTabIndex ? startingElement : undefined);
      }
    } else if (startingElement.parentElement.tagName === 'OTC-MENUGROUP') {
      // If we could not find a previous focusable element and are the child of a menu group, focus the item previous to the menu group.
      this.focusPreviousItem(startingElement.parentElement);
    } else if (startingElement.assignedSlot) {
      // If we could not find a previous focusable element and are in a slot, focus the item previous to the slot.
      this.focusPreviousItem(startingElement.assignedSlot);
    }
  }

  // Find the next focusable sibling from a given element
  static focusNextItem(startingElement, moveTabIndex) {
    Console.log('focusNextItem: Starting from: ', startingElement);

    if (!startingElement) {
      return;
    }

    let nextElement = startingElement.nextElementSibling;
    if (nextElement && nextElement.slot !== startingElement.slot) {
      return; // nextElementSibling is not in same slot -> assume navigation should not jump into different slot
    }

    // Iterate until we find the next element that matches a specified tag.
    while (!!nextElement && !this.isFocusableElement(nextElement) && !this.isHidden(nextElement)) {
      if (!nextElement.nextElementSibling && nextElement.tagName === 'SLOT') {
        // If we are about to run out of sibling elements and the next item is a slot, we should continue with the first slotted item.
        nextElement = nextElement.assignedElements().at(0);
      } else if (!nextElement.nextElementSibling && !!nextElement.assignedSlot) {
        // If we are about to run out of sibling elements and the next item is in a slot, we should continue with the next sibling of the
        // slot.
        nextElement = nextElement.assignedSlot.nextElementSibling;
      } else {
        nextElement = nextElement.nextElementSibling;
      }
    }

    if (nextElement) {
      if (nextElement.tagName === 'OTC-MENUGROUP') {
        // If the next focusable element is a menu group, focus the first item in the group.
        this.focusFirstItem(Array.from(nextElement.children));
      } else {
        this.focusElement(nextElement, moveTabIndex ? startingElement : undefined);
      }
    } else if (startingElement.parentElement.tagName === 'OTC-MENUGROUP') {
      // If we could not find a next focusable element and are the child of a menu group, focus the item next to the menu group.
      this.focusNextItem(startingElement.parentElement);
    }
  }
}

export { FocusUtilities };
//# sourceMappingURL=focus-utilities.js.map
