/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { LitElement } from 'lit';
import { TabIndexController } from '../controllers/tabindexController.js';

/**
 * Enable user interaction with a custom element, which means clicking, typing,
 * focusing and similar behaviour, so that the host element can be used just
 * like the native interactive element, which is placed to the shadow DOM.
 *
 * - Ensure `tabindex=0` on the host if it wasn't set by the application code.
 * - Delegate focus to the inner interactive element too. It means that
 *   accessibility features like ARIA attributes will work well with screen readers.
 * - Delegate the `click` method from the host to the inner interactive element.
 *   It ensures the same behaviour as triggering the event on the inner interactive
 *   element, which usually means changing the state of the inner element like
 *   `checked` for a checkbox.
 *
 * This class is supposed to be used in web components, which include form
 * elements (`input`), `button`, link (`a`) or other elements, which provide
 * user interaction. Not for static (presentation) elements.
 *
 * Always use this class with a base class such as `FormElement` or `ElementBase`.
 *
 * @param superClass The base class, which will be extended by this class.
 * @constructor
 */
const Interactive = superClass => class extends superClass {
  #tabindexController = new TabIndexController(this);

  static get properties() {
    return {
      // Reflect to the standard attribute `tabindex`, which works only
      // for native interactive elements. This might change once we implement
      // native interactiveness by `ElementInternals`.
      tabIndex: {
        type: String,
        reflect: true,
      },
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

  /**
   * Perform the click action on the inner interactive element and trigger
   * the bubbling click event starting on the inner element.
   *
   * Make the programmatically triggered events on the host element behave as if
   * they were triggered on the native (inner) interactive element, which can
   * perform the state change.
   *
   * **Warning**: Triggering the `click` event by `dispatchEvent` doesn't change
   *              the state of the interactive element, like the `checked` flag.
   */
  click() {
    const interactiveElement = this.#getInnerInteractiveElement();

    if (interactiveElement && !this.disabled) {
      interactiveElement.click();
    }
  }

  /**
   * Return the inner interactive element, which the host elements needs
   * to delegate the interaction to.
   *
   * This value is defined by the property `innerInteractiveElement` and it
   * has to be implemented in the inherited class.
   *
   * Throws an error if the property is not implemented by returning an element.
   *
   * @returns The inner interactive element.
   * @throws Error If the descendant class doesn't implement the property
   *               `innerInteractiveElement` properly.
   * @private
   */
  #getInnerInteractiveElement() {
    const { innerInteractiveElement } = this;
    if (innerInteractiveElement !== undefined) {
      return innerInteractiveElement;
    }
    throw new Error('innerInteractiveElement not implemented');
  }
};

export { Interactive };
//# sourceMappingURL=interactive.js.map
