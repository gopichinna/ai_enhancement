/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { OverflowMixin } from '../overflowMixin.js';
import { ElementBase } from '../element-base.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import overflowContainerStyles from './otcOverflowContainer.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';

const OverflowElement = OverflowMixin(ElementBase);

/**
 * The Overflow Container component can be used for layout of a horizontal row of `otc-toolbaritem` items.  It has properties for
 * controlling when items are automatically moved into an overflow menu.
 * @prop {number} [maxItems=0] The maximum number of items to display, including the overflow menu button.
 * @prop {string} [overflowMenuAriaLabel='More actions'] Defines the aria label associated with the overflow menu button.
 * @prop {string} [overflowMenuIconAppearance=''] Defines the icon appearance of the overflow menu button.
 * @prop {boolean} [overflowMenuIsOpen=false] The open state of the overflow menu dropdown.
 * @prop {string} [overflowMenuTitle='More actions'] Defines the title of the overflow menu button.
 * @prop {boolean} [wrapWideItems=false] Automatically display items in an overflow menu when they would exceed the width of the container.
 * @cssprop [--ot-container-gap=16px] The gap between items in the container.
 * @cssprop [--ot-container-justify=flex-start] The justification of items in the container.
 * @slot beforeOverflow Defines the items that will be displayed at the start of the container and will never be moved into the overflow
 * menu.
 * @slot unnamed Defines the items in the container that are allowed to be moved in the overflow menu.
 * @slot afterOverflow Defines the items that will be displayed at the end of the container and will never be moved into the overflow menu.
 * @fires contents-changed **DEPRECATED:** Fired when the contents of the container changes.
 * @fires contentsChanged Fired when the contents of the container changes.
 */
class OtcOverflowContainer extends OverflowElement {
  #themeController = new ThemeController(this);

  #slotNames = {
    beforeOverflow: 'beforeOverflow',
    afterOverflow: 'afterOverflow',
  };

  #shadowRefs = {
    beforeOverflowSlot: e(),
    defaultSlot: e(),
    afterOverflowSlot: e(),
  };

  static get styles() {
    return [
      commonStyleSheet,
      OverflowElement.styles,
      overflowContainerStyles,
    ];
  }

  static get properties() {
    return ThemeController.properties;
  }

  focus() {
    // Since the overflow menu button is in the shadow DOM, there is no way for the integrator to focus it programmatically.  All of the
    // other elements in the overflow container are available in the light DOM and positioned using slots, even if the are currently wrapped
    // in the overflow menu.  So, if you try to programmatically focus the `otc-overflow-container`, we will redirect focus to the overflow
    // menu button, since it is the only element that can't be focused directly otherwise.
    if (!FocusUtilities.isHidden(this.overflowButtonRef.value)) {
      FocusUtilities.focusElement(this.overflowButtonRef.value);
    }
  }

  get #beforeOverflowSlotElements() {
    return this.#shadowRefs.beforeOverflowSlot.value?.assignedElements({ flatten: true });
  }

  get #defaultSlotElements() {
    return this.#shadowRefs.defaultSlot.value?.assignedElements({ flatten: true });
  }

  get #afterOverflowSlotElements() {
    return this.#shadowRefs.afterOverflowSlot.value?.assignedElements({ flatten: true });
  }

  /**
   * Get all elements, including slotted elements and the overflow button.
   * @returns {Array}
   * @internal
   */
  get allElements() {
    // Override the `allElements()` method from the overflow mixin so that we can include the elements in the before overflow and after
    // overflow slots.
    const elements = [];
    if (this.#beforeOverflowSlotElements) {
      elements.push(...this.#beforeOverflowSlotElements);
    }
    if (this.#defaultSlotElements) {
      elements.push(...this.#defaultSlotElements);
    }
    if (this.overflowSlotElements) {
      elements.push(...this.overflowSlotElements);
    }
    if (this.overflowButtonRef.value && !FocusUtilities.isHidden(this.overflowButtonRef.value)) {
      elements.push(this.overflowButtonRef.value);
    }
    if (this.#afterOverflowSlotElements) {
      elements.push(...this.#afterOverflowSlotElements);
    }

    return elements;
  }

  render() {
    return html`<div class="otc-overflow-container"><slot ${n(this.#shadowRefs.beforeOverflowSlot)} name="${this.#slotNames.beforeOverflow}"></slot><slot ${n(this.#shadowRefs.defaultSlot)}></slot>${this.getOverflowButtonTemplate(true, this._themeIsCarbonFiber)}<slot ${n(this.#shadowRefs.afterOverflowSlot)} name="${this.#slotNames.afterOverflow}"></slot></div>`;
  }
}

if (!customElements.get('otc-overflow-container')) {
  customElements.define('otc-overflow-container', OtcOverflowContainer);
}

export { OtcOverflowContainer };
//# sourceMappingURL=otcOverflowContainer.js.map
