/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { debounce } from '../utilities/common-utilities.js';
import { FocusUtilities } from '../utilities/focus-utilities.js';

/**
 * The overflow controller create observers to watch for items that exceed the bounds of their container and then wraps those item into an
 * overflow menu.
 * @fires contents-changed **DEPRECATED:** Fired when the contents of the container changes.
 * @fires contentsChanged Fired when the contents of the container changes.
 */
class OverflowController {
  #host;

  #childMutationObserver = new MutationObserver(this.#handleChildMutation.bind(this));

  #resizeObserver = new ResizeObserver(this.#handleResize.bind(this));

  #debouncedDispatchContentsChangedEvent = debounce(this.dispatchContentsChangedEvent.bind(this), 50);

  #overflowWidth;

  constructor(host) {
    this.#host = host;
    this.#host.addController(this);
  }

  hostConnected() {
    // Observe addition/removal of children of the host element.
    this.#childMutationObserver.observe(this.#host, { childList: true });

    // Observe the host element for changes in size.
    this.#resizeObserver.observe(this.#host);

    // Observe all child elements for changes in size.
    this.#observeSlottedElementResize();

    // Save the width of this component for comparison purposes in #handleResize().
    this.#overflowWidth = window.getComputedStyle(this.#host).width;
  }

  hostDisconnected() {
    // Stop observing all elements for changes in size.
    this.#resizeObserver.disconnect();

    // Stop observing the addition/removal of children of the host element.
    this.#childMutationObserver.disconnect();
  }

  #handleChildMutation() {

    // Stop observing all elements for changes in size.
    this.#resizeObserver.disconnect();

    // Observe the host element for changes in size.
    this.#resizeObserver.observe(this.#host);

    // Observe all child elements for changes in size.
    this.#observeSlottedElementResize();

    // Dispatch a `content-changed` event.
    this.#debouncedDispatchContentsChangedEvent();
  }

  #handleResize(entries) {

    // Find any entries that match this component.
    const thisEntries = entries.filter(entry => entry.target === this.#host);

    // Determine if any of these entries indicate that this component grew in size.
    const widthDidGrow = thisEntries.some(entry => entry.contentRect.width > parseInt(this.#overflowWidth, 10));

    // Populate the overflow menu, skipping the reset if we determine that this component did not grow.  If it did not grow, then it is
    // unlikely that we will be able to move items back out of the overflow menu.
    this.populateOverflowMenu(!widthDidGrow);

    // Save the new width of this component.
    this.#overflowWidth = window.getComputedStyle(this.#host).width;
  }

  #observeSlottedElementResize() {

    // Observe each visible slotted element so that we reset/populate the overflow menu if they change size, e.g. the search component
    // expanding and shrinking.  We do not want to observe elements that are already in the overflow slot.
    this.#host.visibleElements.filter(e => e.slot !== this.#host.overflowSlotName).forEach((element) => {
      this.#resizeObserver.observe(element);
    });
  }

  /**
   * Dispatches an event signalling that the contents of the container have changed.
   * @internal
   */
  dispatchContentsChangedEvent() {
    const eventOptions = { bubbles: true, composed: true };
    const overflowChangedEvent = new CustomEvent('contents-changed', eventOptions);
    this.#host.dispatchEvent(overflowChangedEvent);
    const contentsChangedEvent = new CustomEvent('contentsChanged', eventOptions); // #3599171
    this.#host.dispatchEvent(contentsChangedEvent); // #3599171
  }

  resetOverflowSlot() {

    const { overflowSlotElements } = this.#host;
    const overflowSlotElementsPromises = [];

    if (overflowSlotElements.length > 0) {
      // Reset the slot on all overflowable elements.
      overflowSlotElements.forEach((element) => {
        // Remove the element from the overflow slot.
        this.#removeFromOverflowSlot(element);

        // Save the updateComplete promise so we can wait for them to be resolved later.
        overflowSlotElementsPromises.push(element.updateComplete);
      });

      // Request an update to re-render the new structure.
      this.#host.requestUpdate();

      // Return a promise that combines the `updateComplete` promises of the host and every element that was moved out of the overflow slot.
      return Promise.all([...overflowSlotElementsPromises, this.#host.updateComplete]);
    }

    return Promise.resolve();
  }

  #moveToOverflowSlot(element) {

    if (element.slot !== this.#host.overflowSlotName) {
      // Move the element to the overflow slot.
      element.setAttribute('slot', this.#host.overflowSlotName);

      // Stop observing it for size changes.  Opening the menu so that it is displayed is considered a size change and resets the overflow.
      this.#resizeObserver.unobserve(element);
    }
  }

  #removeFromOverflowSlot(element) {

    if (element.slot === this.#host.overflowSlotName) {
      // Remove the element from the overflow slot.
      element.removeAttribute('slot');

      // Start observing it for size changes again.
      this.#resizeObserver.observe(element);
    }
  }

  #isFullyContained(root, element) {
    const rootRect = root.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if ((Math.floor(rootRect.left) <= elementRect.left) && (Math.ceil(rootRect.right) >= elementRect.right)) {
      return true;
    }

    return false;
  }

  async populateOverflowMenu(skipReset = false) {

    // We only handle moving items into the overflow menu if one of these two properties is set.
    if ((this.#host.maxItems <= 0) && !this.#host.wrapWideItems) {
      return;
    }

    // Save the initial state of the overflow slot.
    const overflowSlotElementsBefore = this.#host.overflowSlotElements;

    // Restore all overflowable items to the host.
    if (!skipReset) {
      await this.resetOverflowSlot();
    }

    // Keep track of how many items are currently displayed.
    let numItemsShown = this.#host.visibleElements.length;

    if (this.#host.wrapWideItems) {
      // Iterate through the overflowable items in reverse order, moving them to the overflow menu as necessary until the elements do not
      // exceed the width of the host.
      const { overflowableElements } = this.#host;
      for (const el of overflowableElements.slice().reverse()) {
        const { visibleElements } = this.#host;
        if (visibleElements.length <= 0) {
          break;
        }

        const firstElement = visibleElements.at(0);
        if (!firstElement) {
          break;
        }

        const lastElement = visibleElements.at(-1);
        if (!lastElement) {
          break;
        }

        // Check if either the first or last visible element exceeds the width of the host.
        if (!this.#isFullyContained(this.#host, firstElement) || !this.#isFullyContained(this.#host, lastElement)) {
          this.#moveToOverflowSlot(el);

          // Update the number of items currently shown.
          numItemsShown -= 1;

          // Request an update to re-render the new structure.
          this.#host.requestUpdate();

          // eslint-disable-next-line no-await-in-loop
          await Promise.all([el.updateComplete, this.#host.updateComplete]);
        } else {
          break;
        }
      }
    }

    // Only restrict the items if we currently displaying more items than the max.
    if ((this.#host.maxItems > 0) && (this.#host.maxItems < numItemsShown)) {
      const { overflowableElements, nonOverflowableElements } = this.#host;

      // Determine the number of items that are always shown and can not be wrapped in the overflow menu
      const alwaysShownItemsCount = nonOverflowableElements.filter(e => !FocusUtilities.isHidden(e)).length;

      // Subtract the number of always shown items from `maxItems`.  This is the number of items in the overflow slot that should be shown.
      const overflowSlotItemsToShow = this.#host.maxItems - alwaysShownItemsCount;

      if (overflowSlotItemsToShow === overflowableElements.length) {
        // Since the number of overflowableElements is equal to the number of items to show, ensure they are all removed from the overflow
        // slot.  Without this special case, the next code block would end up wrapping a single item into the overflow menu.
        overflowableElements.forEach(element => this.#removeFromOverflowSlot(element));
      } else if (overflowSlotItemsToShow <= 1) {
        // Wrap all overflowable elements into the overflow menu.
        overflowableElements.forEach(element => this.#moveToOverflowSlot(element));
      } else {
        overflowableElements.slice(0, overflowSlotItemsToShow - 1).forEach(element => this.#removeFromOverflowSlot(element));
        overflowableElements.slice(overflowSlotItemsToShow - 1).forEach(element => this.#moveToOverflowSlot(element));
      }
    }

    // Save the state of the overflow slot after re-populating it.
    const afterOverflowSlotElements = this.#host.overflowSlotElements;

    // Dispatch a `content-changed` event only if the contents of the overflow slot changed.
    if ((overflowSlotElementsBefore.length !== afterOverflowSlotElements.length
      || !overflowSlotElementsBefore.every((value, index) => value === afterOverflowSlotElements[index]))) {
      this.#debouncedDispatchContentsChangedEvent();
    }
  }
}

export { OverflowController };
//# sourceMappingURL=overflowController.js.map
