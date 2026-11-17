/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { css, html, nothing } from 'lit';
import { actionCheckmarkSelect } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { FormElement } from '../form-element.js';
import { escapeRegExp } from '../../utilities/common-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import otcMenuItemBaseStyles from '../menu/otcMenuItemBase.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { unsafeHTML as o } from '../../../node_modules/lit-html/directives/unsafe-html.js';

/**
 * The Select Item component represents an item to be displayed in an `otc-select` component.
 * @prop {string} displayValue The display value of the select item.
 * @prop {boolean} isResetSelectionItem Determines if this is a special type of item that is used to clear an `otc-select`.
 * @prop {boolean} selected Determine if this item is the currently selected item in an `otc-select`.
 * @prop {string} value The value of the select item.
 * @slot unnamed The text of the item.
 */
class OtcSelectItem extends FormElement {
  static get formAssociated() {
    return false;
  }

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      otcMenuItemBaseStyles,
      css`:host{display:block}`,
    ];
  }

  static get properties() {
    const props = {
      displayValue: { type: String, reflect: false },
      isResetSelectionItem: { type: Boolean, reflect: false },
      selected: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
      _filteredText: { state: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  constructor() {
    super();

    this.displayValue = '';
    this.isResetSelectionItem = false;
    this.selected = false;
    this.value = '';
    this._filteredText = '';

    // Sometimes, Cypress has difficulty with click events on elements in the shadow root.  Sometimes the click event would happen on the
    // shadow element before bubbling up to the web component itself.  Other times the click would only happen on the web component itself
    // and a handler for click events on the shadow element would not be called.
    // At least for this component, there is nothing that requires the click handler to be on the shadow element.  So, we will add it to the
    // web component itself instead to work around the intermittent failures in Cypress.
    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  /**
   * Get the native option element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this._dropdownItem;
  }

  firstUpdated() {
    // If no value was provided, we will use the text content of the item.  This matches the behavior of the native `option` element.
    if (!this.value) {
      this.value = this.textContent;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('selected')) {
      if (this.selected) {
        const parentSelect = this.closest('otc-select');
        if (parentSelect) {
          parentSelect.value = this.value;
        }
      }
    }
  }

  _handleClick() {
    if (this.isResetSelectionItem) {
      const parentSelect = this.getRootNode().host;
      if (parentSelect && parentSelect.tagName === 'OTC-SELECT') {
        parentSelect.value = '';
      }
    } else {
      this.selected = true;
    }
  }

  _handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        // Handle Enter or Spacebar as if we clicked the item.
        this._handleClick();
        break;
    }
  }

  get _dropdownItem() {
    if (this.shadowRoot) {
      return this.shadowRoot.getElementById('selectitem-dropdownitem');
    }

    return null;
  }

  filterContent(filterValue) {
    // Escape the filter value to ensure any special characters are used literally.
    const escapedValue = escapeRegExp(filterValue);

    // Convert all spaces in `displayValue` to non-breaking spaces (&nbsp;).  Otherwise, Lit will remove whitespace surrounding the filtered
    // text during render.
    const nbspValue = this.displayValue.replaceAll(/\s/g, '\u00A0');

    // Highlight matched characters by surrounding them with `strong` tags.
    const regExp = new RegExp(`(${escapedValue})`, 'ig');
    this._filteredText = nbspValue.replaceAll(regExp, '<strong class="otc-select__filter">$1</strong>');
  }

  restoreContent() {
    this._filteredText = this.displayValue;
  }

  _isCheckSelected() {
    const parentSelect = this.closest('otc-select');
    if (parentSelect) {
      return !!parentSelect.checkSelected;
    }

    return false;
  }

  _handleSlotChange(event) {
    this.displayValue = event.target.assignedNodes().map(node => node.textContent).join('').trim();
    this._filteredText = this.displayValue;
  }

  #getCheckSelectedTemplate() {
    if (this._isCheckSelected()) {
      const checkSelectedIconClasses = {
        'ot-dropdown__item--check-selected-icon': true,
      };

      return html`<otc-icon aria-hidden="true" class="${e(checkSelectedIconClasses)}" disableEffects isPresentation svg="${actionCheckmarkSelect}"></otc-icon>`;
    }

    return nothing;
  }

  render() {
    const dropdownItemClasses = {
      'ot-dropdown__item': true,
      'ot-dropdown__item--is-selected': this.selected,
      'ot-dropdown__item--is-secondary': this._isCheckSelected(),
    };

    return html`<div id="selectitem-dropdownitem" class="${e(dropdownItemClasses)}" ?selected="${this.selected}" .value="${this.value}" role="option" tabindex="-1" aria-label="${this.ariaLabel || nothing}" aria-selected="${this.selected}">${this.#getCheckSelectedTemplate()} <span>${o(this._filteredText)}</span></div><slot @slotchange="${this._handleSlotChange}" class="ot--is-hidden"></slot>`;
  }
}

if (!customElements.get('otc-selectitem')) {
  customElements.define('otc-selectitem', OtcSelectItem);
}

export { OtcSelectItem };
//# sourceMappingURL=otcSelectItem.js.map
