import { html, nothing } from 'lit';
import { OTC_ICON_BUNDLE_WC_HEADER, OTC_ICON_BUNDLE_WC_ACTION } from '../utilities/render-utilities.js';
import { flattenElementArray } from '../utilities/common-utilities.js';
import { OverflowController } from '../controllers/overflowController.js';
import commonStyleSheet from '../styles/common.scss.js';
import { createRef as e, ref as n } from '../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../node_modules/lit-html/directives/class-map.js';

/**
 * The overflow mixin adds the properties and controller necessary to support automatically wrapping toolbar items into an overflow menu.
 * @prop {number} maxItems The maximum number of items to display, including the overflow menu button.
 * @prop {string} overflowMenuAriaLabel Defines the aria label associated with the overflow menu button.
 * @prop {string} overflowMenuIconAppearance Defines the icon appearance of the overflow menu button.
 * @prop {string} overflowMenuTitle Defines the title of the overflow menu button.
 * @prop {boolean} wrapWideItems Automatically display items in an overflow menu when they would exceed the width of the container.
 */
const OverflowMixin = superClass => class extends superClass {
  #overflowController;

  #overflowButtonId = 'otc-overflow-button';

  overflowSlotName = 'otc-overflow-slot';

  overflowButtonRef = e();

  #overflowSlotRef = e();

  static get styles() {
    return [
      commonStyleSheet,
    ];
  }

  static get properties() {
    return {
      maxItems: { type: Number, reflect: true },
      overflowMenuAriaLabel: { type: String, reflect: true },
      overflowMenuIconAppearance: { type: String, reflect: true },
      overflowMenuTitle: { type: String, reflect: true },
      wrapWideItems: { type: Boolean, reflect: true },
      _hasOverflow: { state: true },
    };
  }

  constructor() {
    super();

    this.maxItems = 0;
    this.overflowMenuAriaLabel = 'More actions';
    this.overflowMenuIconAppearance = '';
    this.overflowMenuTitle = 'More actions';
    this.wrapWideItems = false;

    this._hasOverflow = false;
  }

  firstUpdated() {
    // The overflow controller needs to observe the children of the host element, so we need to wait until after the first update to ensure
    // that all of the children have finished being created.
    this.#overflowController = new OverflowController(this);
  }

  updated(changedProperties) {
    if (changedProperties.has('wrapWideItems') || changedProperties.has('maxItems')) {
      if ((this.maxItems <= 0) && !this.wrapWideItems) {
        // We do not have a property that enables the use of the overflow menu, so reset any items that might be in the overflow menu.
        this.#overflowController.resetOverflowSlot();

        // Dispatch a `content-changed` event.
        this.#overflowController.dispatchContentsChangedEvent();
      } else {
        this.#overflowController.populateOverflowMenu();
      }
    }
  }

  /**
   * Get an array of all child elements, flattened to directly include all child elements, elements in slots, elements in our group-type
   * components, etc.
   * @returns {Array}
   * @internal
   */
  get childElements() {
    return flattenElementArray(this.children);
  }

  /**
   * Get all elements, including slotted elements and the overflow button.
   * @returns {Array}
   * @internal
   */
  get allElements() {
    const elements = this.childElements;
    if (this.overflowButtonRef?.value) {
      elements.push(this.overflowButtonRef.value);
    }

    return elements;
  }

  /**
   * Get the slotted elements that are able to be placed in the overflow menu.
   * @returns {Array}
   * @internal
   */
  get overflowableElements() {
    return flattenElementArray(this.children).filter(x => x.tagName === 'OTC-TOOLBARITEM');
  }

  /**
   * Get the slotted elements that are not able to be placed in the overflow menu.
   * @returns {Array}
   * @internal
   */
  get nonOverflowableElements() {
    return flattenElementArray(this.children).filter(x => x.tagName !== 'OTC-TOOLBARITEM');
  }

  get overflowSlotElements() {
    return this.#overflowSlotRef.value?.assignedElements({ flatten: true }) ?? [];
  }

  #handleOverflowButtonKeyDown(event) {
    // Check to see if we are trying to move up from the first item in the overflow slot.
    if ((event.key === 'ArrowUp') && (event.target === this.overflowSlotElements[0])) {
      // Stop the menu key handler from focusing the previous item, as it is outside of the menu.
      event.preventDefault();
      event.stopPropagation();
    }
  }

  #handleOverflowSlotChange() {
    this._hasOverflow = this.overflowSlotElements?.length > 0;
  }

  getOverflowButtonTemplate(isTabbale = false) {
    const overflowClasses = {
      // We want to show the overflow menu button only when there are items in the overflow slot or if we are currently populating the
      // overflow menu.
      'ot--is-hidden': !this._hasOverflow,
    };

    const isHeaderItem = !!this.closest('otc-header-bar');
    const moreIcon = isHeaderItem ? `${OTC_ICON_BUNDLE_WC_HEADER}:header_more42` : `${OTC_ICON_BUNDLE_WC_ACTION}:action_more32`;
    return html`<otc-toolbaritem ${n(this.overflowButtonRef)} ariaLabel="${this.overflowMenuAriaLabel}" class="${e$1(overflowClasses)}" ?headerItem="${isHeaderItem}" icon="${moreIcon}" iconAppearance="${this.overflowMenuIconAppearance}" id="${this.#overflowButtonId}" tabIndex="${isTabbale ? nothing : -1}" title="${this.overflowMenuTitle}" @keydown="${{ handleEvent: event => this.#handleOverflowButtonKeyDown(event), capture: true }}"><slot ${n(this.#overflowSlotRef)} class="${e$1(overflowClasses)}" name="${this.overflowSlotName}" @slotchange="${this.#handleOverflowSlotChange}"></slot></otc-toolbaritem>`;
  }
};

export { OverflowMixin };
//# sourceMappingURL=overflowMixin.js.map
