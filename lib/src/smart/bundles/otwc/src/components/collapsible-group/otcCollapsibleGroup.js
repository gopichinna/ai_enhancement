/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { actionChevronSmallDown, actionChevronSmallRight } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { ElementBase } from '../element-base.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import commonStyleSheet from '../../styles/common.scss.js';
import collapsibleGroupStyleSheet from './otcCollapsibleGroup.scss.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { ThemeController } from '../../controllers/themeController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The collapsible group component can be used to display a list of items that belong to a group, which can be expanded or collapsed.
 * @prop {boolean} expanded Defines if the group items are rendered (expanded="true") or not (collapsed => expanded="false")
 * @prop {string} [ariaLabel=''] Defines the aria label associated with the whole collapsible group region.
 * @prop {string} [showToggleMode='visible'] Defines the behavior of the expand/collapse toggle button. If set to `auto`, the
 * expand/collapse toggle is shown automatically if child items are detected in the `unnamed` slot and not shown it no items
 * are in the `unnamed` slot.
 * If set to 'visible' the expand/collapse toggle button is always shown and if set to `hidden` it will never be shown.
 * @prop {string} [toggleAriaLabel='Details'] Defines the aria label associated with the expand/collapse toggle button.
 * @prop {string} [toggleExpandTitle='Expand'] Defines the title for the collapsed state of the toggle button.
 * @prop {string} [toggleCollapseTitle='Collapse'] Defines the title for the expanded state of the toggle button.
 * @prop {string} [listAriaLabel='Items'] Defines the aria-label of the element that wraps all list items from the default slot to
 * describe the list.
 * @slot header Defines the html elements rendered in the collapsible group header area (left of the toggle button)
 * @slot auxiliary Defines the html elements rendered on top of the group list items (only if expanded)
 * @slot unnamed Defines the items of the group list. Shown only if expanded.
 */
class OtcCollapsibleGroup extends ElementBase {
  #haveItemsInUnnamedSlot;

  #themeController = new ThemeController(this);

  constructor() {
    super();

    this.ariaLabel = '';
    this.showToggleMode = 'visible';
    this.toggleAriaLabel = 'Details';
    this.toggleExpandTitle = 'Expand';
    this.toggleCollapseTitle = 'Collapse';
    this.listAriaLabel = 'Items';
    this.expanded = false;
    this.#haveItemsInUnnamedSlot = false;
  }

  static get properties() {
    const props = {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      showToggleMode: {
        type: String,
        reflect: true,
      },
      toggleAriaLabel: {
        type: String,
        reflect: true,
      },
      toggleExpandTitle: {
        type: String,
        reflect: true,
      },
      toggleCollapseTitle: {
        type: String,
        reflect: true,
      },
      listAriaLabel: {
        type: String,
        reflect: true,
      },
      expanded: {
        type: Boolean,
        reflect: true,
      },
    };
    return { ...ThemeController.properties, ...props };
  }

  static get styles() {
    return [
      commonStyleSheet,
      collapsibleGroupStyleSheet,
    ];
  }

  updated(changedProperties) {
    if (changedProperties.has('expanded')) {
      // Dispatch open and close events.
      // There is no animation, so we can just dispatch the event immediately.
      const event = new CustomEvent(this.expanded ? 'open' : 'close', {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  #getListTemplate() {
    if (this.expanded) {
      return html`<slot @slotchange="${(event) => { this.#onSlotChange.call(this, event); }}"></slot>`;
    }
    return html``;
  }

  #getAuxiliarySlotTemplate() {
    if (this.expanded) {
      return html`<slot name="auxiliary"></slot>`;
    }
    return html``;
  }

  #getGroupContentTemplate() {
    const auxClasses = {
      'otc-collapsible-group-auxiliary-slot': true,
      'otc-collapsible-group--is-hidden': !this.expanded,
    };
    const listClasses = {
      'otc-collapsible-group-list': true,
      'otc-collapsible-group--is-hidden': !this.expanded,
    };
    return html`<div class="${e(auxClasses)}" @keydown="${(event) => { this.#handleKeyDown.call(this, event); }}">${this.#getAuxiliarySlotTemplate()}</div><div role="list" class="${e(listClasses)}" id="collapsible-group-list" aria-label="${this.listAriaLabel || nothing}" @keydown="${(event) => { this.#handleKeyDown.call(this, event); }}"><slot @slotchange="${(event) => { this.#onSlotChange.call(this, event); }}"></slot></div>`;
  }

  #renderToggleButton() {
    const title = this.expanded ? this.toggleCollapseTitle : this.toggleExpandTitle;
    if (this._themeIsCarbonFiber) {
      const icon = this.expanded ? 'otc-action:action_caret_up32' : 'otc-action:action_caret_down32';
      return html`<otc-button icon="${icon}" ariaLabel="${this.toggleAriaLabel}" ariaExpanded="${this.expanded}" @click="${this.#handleClick}" title="${title}"></otc-button>`;
    }
    const svg = this.expanded ? actionChevronSmallDown : actionChevronSmallRight;
    return html`<otc-button ariaLabel="${this.toggleAriaLabel}" ariaExpanded="${this.expanded}" @click="${this.#handleClick}" title="${title}" size="small"><otc-icon svg="${svg}"></otc-icon></otc-button>`;
  }

  #renderToggleButtonPlaceholder() {
    return html`<div class="otc-collapsible-group--toggle-button-placeholder"></div>`;
  }

  #renderToggleButtonIfNeeded() {
    switch (this.showToggleMode) {
      case '':
      case 'visible':
        return this.#renderToggleButton();
      case 'auto':
        if (this.#haveItemsInUnnamedSlot) {
          return this.#renderToggleButton();
        }
        return this.#renderToggleButtonPlaceholder();
      default:
        return nothing;
    }
  }

  render() {
    return html`<div role="region" aria-label="${this.ariaLabel || nothing}"><div class="otc-collapsible-group-header">${this._themeIsCarbonFiber ? nothing : this.#renderToggleButtonIfNeeded()}<slot name="header" class="otc-collapsible-group-header-content-slot"></slot>${this._themeIsCarbonFiber ? this.#renderToggleButtonIfNeeded() : nothing}</div>${this.#getGroupContentTemplate()}</div>`;
  }

  #handleClick() {
    this.expanded = !this.expanded;
  }

  #handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown': {
        // Stop the window from scrolling.
        event.preventDefault();

        // Focus the next item.
        FocusUtilities.focusNextItem(event.target, true);

        // Stop the event from propagating.
        event.stopPropagation();
        break;
      }

      case 'ArrowUp':
        // Stop the window from scrolling.
        event.preventDefault();

        // Focus the previous item.
        FocusUtilities.focusPreviousItem(event.target, true);

        // Stop the event from propagating.
        event.stopPropagation();
        break;

      // no default
    }
  }

  #onSlotChange(event) {
    const slot = event.target;
    // propagate the name attribute to each slot element that is an otc-radio
    let haveFocusable = false;
    const slottedGroupItems = [];
    slot.assignedElements().forEach(
      (elem) => {
        slottedGroupItems.push(elem);
        if (elem.getAttribute('tabindex') === '0') {
          haveFocusable = true;
        }
      },
    );
    const haveItems = slottedGroupItems.length > 0;
    const mustUpdate = haveItems !== this.#haveItemsInUnnamedSlot;
    this.#haveItemsInUnnamedSlot = haveItems;
    if (!haveFocusable && haveItems) {
      slottedGroupItems[0].setAttribute('tabindex', '0'); // make first element in slot focusable
    }
    if (mustUpdate) {
      this.requestUpdate();
    }
  }
}

customElements.define('otc-collapsible-group', OtcCollapsibleGroup);

export { OtcCollapsibleGroup };
//# sourceMappingURL=otcCollapsibleGroup.js.map
