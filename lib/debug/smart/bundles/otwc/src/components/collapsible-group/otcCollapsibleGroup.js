import { html } from 'lit';
import { ElementBase } from '../element-base.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import commonStyleSheet from '../../styles/common.scss.js';
import collapsibleGroupStyleSheet from './otcCollapsibleGroup.scss.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';

/**
 * The collapsible group component can be used to display a list of items that belong to a group, which can be expanded or collapsed.
 * @prop {boolean} expanded Defines if the group items are rendered (expanded="true") or not (collapsed => expanded="false")
 * @prop {string} [ariaLabel=''] Defines the aria label associated with the whole collapsible group region.
 * @prop {string} [toggleAriaLabel='Details'] Defines the aria label associated with the expand/collapse toggle button.
 * @prop {string} [listAriaLabel='Items'] Defines the aria-label of the element that wraps all list items from the default slot to
 * describe the
 * list.
 * @slot header Defines the html elements rendered in the collapsible group header area (left from the toggle button)
 * @slot auxiliary Defines the html elements rendered on top of the group list items (only if expanded)
 * @slot unnamed Defines the items of the group list. Shown only if expanded.
 */
class OtcCollapsibleGroup extends ElementBase {
  constructor() {
    super();

    this.ariaLabel = '';
    this.toggleAriaLabel = 'Details';
    this.listAriaLabel = 'Items';
    this.expanded = false;
  }

  static get properties() {
    return {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      toggleAriaLabel: {
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
  }

  static get styles() {
    return [
      commonStyleSheet,
      collapsibleGroupStyleSheet,
    ];
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
    if (this.expanded) {
      return html`<div class="otc-collapsible-group-auxiliary-slot" @keydown="${(event) => { this.#handleKeyDown.call(this, event); }}">${this.#getAuxiliarySlotTemplate()}</div><div role="list" class="otc-collapsible-group-list" id="collapsible-group-list" aria-label="${this.listAriaLabel}" @keydown="${(event) => { this.#handleKeyDown.call(this, event); }}">${this.#getListTemplate()}</div>`;
    }
    return html``;
  }

  render() {
    let icon = 'otc-action:action_caret_down32';
    if (this.expanded) {
      icon = 'otc-action:action_caret_up32';
    }
    return html`<div role="region" aria-label="${this.ariaLabel}"><div class="otc-collapsible-group-header"><slot name="header" class="otc-collapsible-group-header-content-slot"></slot><otc-button icon="${icon}" ariaLabel="${this.toggleAriaLabel}" ariaExpanded="${this.expanded}" aria-controls="${this.expanded ? 'collapsible-group-list' : ''}" @click="${this.#handleClick}"></otc-button></div>${this.#getGroupContentTemplate()}</div>`;
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
    if (!haveFocusable && slottedGroupItems.length > 0) {
      slottedGroupItems[0].setAttribute('tabindex', '0'); // make first element in slot focusable
    }
  }
}

customElements.define('otc-collapsible-group', OtcCollapsibleGroup);

export { OtcCollapsibleGroup };
//# sourceMappingURL=otcCollapsibleGroup.js.map
