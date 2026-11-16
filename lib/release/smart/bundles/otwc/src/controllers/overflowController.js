import { debounce } from '../utilities/common-utilities.js';
import { FocusUtilities } from '../utilities/focus-utilities.js';
import { Console } from '../utilities/logging-utilities.js';

/**
 * The overflow controller create observers to watch for items that exceed the bounds of their container and then wraps those item into an
 * overflow menu.
 * @fires contents-changed Fired when the contents of the container changes.
 */
class OverflowController {
  #host;

  #childMutationObserver = new MutationObserver(this.#handleChildMutation.bind(this));

  #resizeObserver = new ResizeObserver(this.populateOverflowMenu.bind(this));

  #debouncedDispatchContentsChangedEvent = debounce(this.dispatchContentsChangedEvent.bind(this), 50);

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
  }

  hostDisconnected() {
    // Stop observing all elements for changes in size.
    this.#resizeObserver.disconnect();

    // Stop observing the addition/removal of children of the host element.
    this.#childMutationObserver.disconnect();
  }

  #handleChildMutation() {
    Console.log('overflowController: handleChildMutation');

    // Stop observing all elements for changes in size.
    this.#resizeObserver.disconnect();

    // Observe the host element for changes in size.
    this.#resizeObserver.observe(this.#host);

    // Observe all child elements for changes in size.
    this.#observeSlottedElementResize();

    // Dispatch a `content-changed` event.
    this.#debouncedDispatchContentsChangedEvent();
  }

  #observeSlottedElementResize() {
    Console.log('overflowController: observeSlottedElementResize');

    // Observe each visible slotted element so that we reset/populate the overflow menu if they change size, e.g. the search component
    // expanding and shrinking.
    const { allElements } = this.#host;
    allElements.filter(e => !FocusUtilities.isHidden(e)).forEach((element) => {
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
  }

  resetOverflowSlot() {
    Console.log('overflowController: resetOverflowSlot');

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
    Console.log('overflowController: moveToOverflowSlot: ', element);

    if (element.slot !== this.#host.overflowSlotName) {
      // Move the element to the overflow slot.
      element.setAttribute('slot', this.#host.overflowSlotName);

      // Stop observing it for size changes.  Opening the menu so that it is displayed is considered a size change and resets the overflow.
      this.#resizeObserver.unobserve(element);
    }
  }

  #removeFromOverflowSlot(element) {
    Console.log('overflowController: removeFromOverflowSlot: ', element);

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

  async populateOverflowMenu() {
    Console.log('overflowController: populateOverflowMenu: BEGIN');

    // We only handle moving items into the overflow menu if one of these two properties is set.
    if ((this.#host.maxItems <= 0) && !this.#host.wrapWideItems) {
      Console.log('overflowController: populateOverflowMenu - skipping due to lack of properties');
      return;
    }

    // Save the initial state of the overflow slot.
    const overflowSlotElementsBefore = this.#host.overflowSlotElements;

    if (this.#host.maxItems > 0) {
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
    } else if (this.#host.wrapWideItems) {
      // Restore all overflowable items to the host.
      await this.resetOverflowSlot();

      // Iterate through the overflowable items in reverse order, moving them to the overflow menu as necessary until the elements do not
      // exceed the width of the host.
      const { overflowableElements } = this.#host;
      for (const el of overflowableElements.slice().reverse()) {
        const visibleElements = this.#host.allElements.filter(e => !FocusUtilities.isHidden(e) && (e.slot !== this.#host.overflowSlotName));
        if (visibleElements.length <= 0) {
          Console.log('overflowController: populateOverflowMenu - No visible elements found');
          break;
        }

        const firstElement = visibleElements.at(0);
        if (!firstElement) {
          Console.log('overflowController: populateOverflowMenu - First visible element not found');
          break;
        }

        const lastElement = visibleElements.filter(e => !FocusUtilities.isHidden(e)).at(-1);
        if (!lastElement) {
          Console.log('overflowController: populateOverflowMenu - Last visible element not found');
          break;
        }

        // Check if either the first or last visible element exceeds the width of the host.
        if (!this.#isFullyContained(this.#host, firstElement) || !this.#isFullyContained(this.#host, lastElement)) {
          this.#moveToOverflowSlot(el);

          // Request an update to re-render the new structure.
          this.#host.requestUpdate();

          // eslint-disable-next-line no-await-in-loop
          await Promise.all([el.updateComplete, this.#host.updateComplete]);
        } else {
          break;
        }
      }
    }

    // Save the state of the overflow slot after re-populating it.
    const afterOverflowSlotElements = this.#host.overflowSlotElements;

    // Dispatch a `content-changed` event only if the contents of the overflow slot changed.
    if ((overflowSlotElementsBefore.length !== afterOverflowSlotElements.length
      || !overflowSlotElementsBefore.every((value, index) => value === afterOverflowSlotElements[index]))) {
      this.#debouncedDispatchContentsChangedEvent();
    }

    Console.log('overflowController: populateOverflowMenu: END');
  }
}

export { OverflowController };
//# sourceMappingURL=overflowController.js.map
