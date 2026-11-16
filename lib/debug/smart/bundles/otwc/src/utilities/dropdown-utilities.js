class DropdownUtilities {
  static clearDropdownPositionStyles(dropdownElement, dropdownMenu) {
    if (dropdownElement) {
      dropdownElement.style.position = '';
      dropdownElement.style.top = '';
      dropdownElement.style.left = '';
      dropdownElement.style.width = '';
    }

    if (dropdownMenu) {
      dropdownMenu.style.position = '';
      dropdownMenu.style.top = '';
      dropdownMenu.style.left = '';
    }
  }

  /**
   * Returns a promise which resolves when all animations of a specified element have finished.
   * @param {Object} element An element with attached animations.
   * @returns {Promise} A promise that resolves when all animations have finished.
   */
  static waitForAnimations(element) {
    if (element) {
      // Get an array of all animations on the element.
      const elementAnimations = element.getAnimations();

      // Create an array of the 'finished' promises of each animation.
      const animationFinishedPromises = elementAnimations.map(animation => animation.finished);

      // Wait for all animations to finish.
      return Promise.allSettled(animationFinishedPromises);
    }

    return Promise.resolve();
  }

  // Reset any filtering done to a given set of elements.
  static resetFilteredDropdownItems(elements) {
    if (elements && elements.length > 0) {
      for (const element of elements) {
        element.style.removeProperty('display');
        if (element.restoreContent) {
          element.restoreContent();
        }
      }
    }
  }

  // Filter and highlight a given set of elements based on a given filter value.
  static filterDropdownItems(elements, filterValue) {
    if (!elements || (elements.length < 1) || (filterValue.length < 1)) {
      return;
    }

    for (const element of elements) {
      if (element.textContent.toLowerCase().includes(filterValue.toLowerCase())) {
        // Highlight the text of the matching items.
        if (element.filterContent) {
          element.filterContent(filterValue);
        }
      } else {
        // Hide the non-matching items.
        element.style.setProperty('display', 'none', 'important');
      }
    }
  }
}

export { DropdownUtilities };
//# sourceMappingURL=dropdown-utilities.js.map
