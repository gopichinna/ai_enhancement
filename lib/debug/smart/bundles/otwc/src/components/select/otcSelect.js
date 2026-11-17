import { html, nothing } from 'lit';
import { actionChevronLargeDown } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import { triggerEvent } from '../../utilities/common-utilities.js';
import { DropdownUtilities } from '../../utilities/dropdown-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import commonStyleSheet from '../../styles/common.scss.js';
import selectStyles from './otcSelect.scss.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Select component represents a dropdown list of items for the user to choose from.
 * @prop {string} autocomplete The `autocomplete` attribute of the input.
 * @prop {boolean} caretRightSpacingLarge Reposition the caret icon.  Used by `otc-multivalue` to prevent overlap with its icons.
 * @prop {boolean} checkSelected Toggle checkmark styling of the select items.
 * @prop {boolean} disableAnimation Prevent the default menu animations from running.
 * @prop {boolean} disableFiltering Disable filtering of items while typing.<br>
 * This should be used, when you want to update the options dynamically.
 * @prop {boolean} disableInputReset Disable resetting of the input to match the selected value when focus is lost.
 * @prop {boolean} disableNoneOption Controls whether to hide the item in the dropdown, that will reset the selection.
 * @prop {string} displayValue The display value of the select.
 * @prop {boolean} isTypeaheadSearch Enable specific behaviors for typeahead select. Such as disable the filter and input reset.
 * @prop {number} maxItems The maximum number of items to display in the dropdown before scrolling is enabled.
 * @prop {boolean} menuOpen Indicates that the button is associated with a menu that is currently open.
 * @prop {string} noneAriaLabel Defines the aria-label of the item in the dropdown that will reset the selection.
 * @prop {string} noneLabel Defines the text of the item in the dropdown that will reset the selection.
 * @prop {string} placeholder Defines the placeholder text of the input.
 * @prop {boolean} usePopover Uses the Popover API to display the menu.
 * @prop {string} value The value of the selected item.
 * @slot unnamed Defines the content of the menu.
 * **Note: ** It is strongly recommended that you only use `otc-selectitem`, `otc-selectextensibleitem or `otc-selectuseritem` components
 * in order to preserve the intended design.
 * @fires change Fired when the value of the select has changed.  This follows the same rules as the native element, where this event is
 * only fired when the value is changed interactively.
 * @fires value-changed **DEPRECATED:** Fired every time value of the select has changed.
 * @fires valueChanged Fired every time value of the select has changed.
 */
class OtcSelect extends FormElement {
  #selectItemTypeSelector = 'otc-selectitem, otc-selectextensibleitem, otc-selectuseritem';

  #menuIsOpenMutationObserver = new MutationObserver(this.#handleMenuIsOpenMutation.bind(this));

  #menuWrapperResizeObserver = new ResizeObserver(this.#handleMenuWrapperResize.bind(this));

  // Used internally to access elements in the shadow root.
  #partRefs = {
    input: e(),
    menu: e(),
    menuWrapper: e(),
    slot: e(),
  };

  /**
   * Get the native input element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this.#partRefs.input.value;
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      selectStyles,
    ];
  }

  static get properties() {
    const props = {
      autocomplete: { type: String, reflect: true },
      caretRightSpacingLarge: { type: Boolean, reflect: true },
      checkSelected: { type: Boolean, reflect: true },
      disableAnimation: { type: Boolean, reflect: true },
      disableFiltering: { type: Boolean, reflect: true },
      disableInputReset: { type: Boolean, reflect: true },
      disableNoneOption: { type: Boolean, reflect: true },
      displayValue: { type: String, reflect: false },
      isTypeaheadSearch: { type: Boolean, reflect: true },
      maxItems: { type: Number, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
      noneAriaLabel: { type: String, reflect: true },
      noneLabel: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      usePopover: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  constructor() {
    super();

    this.autocomplete = null;
    this.caretRightSpacingLarge = false;
    this.checkSelected = false;
    this.disableAnimation = false;
    this.disableFiltering = false;
    this.disableInputReset = false;
    this.disableNoneOption = false;
    this.displayValue = '';
    this.isTypeaheadSearch = false;
    this.maxItems = 20;
    this.menuOpen = false;
    this.noneAriaLabel = 'Reset Selection';
    this.noneLabel = 'None';
    this.placeholder = '';
    this.usePopover = false;
    this.value = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    // Watch for changes in the `isOpen` attribute.  For example, the menu button click handler will open the menu by toggling the `isOpen`
    // attribute.  We want to keep our `menuOpen` property in sync in cases like this.
    this.#menuIsOpenMutationObserver.observe(this.#partRefs.menu.value, { attributes: true, attributeFilter: ['isopen'] });

    // Observe the host element for changes in size.
    this.#menuWrapperResizeObserver.observe(this.#partRefs.menuWrapper.value);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Stop observing for changes in size.
    this.#menuWrapperResizeObserver.disconnect();

    // Stop watching for changes in the `isOpen` attribute.
    this.#menuIsOpenMutationObserver.disconnect();
  }

  firstUpdated(changedProperties) {
    if (changedProperties.has('value')) {
      // Our child items might not have finished being created yet.  We need them to be finished so that we can find the item that matches
      // our `value` property.  We will wait to call `#updateSelection` until all child elements have finished being created.
      const slottedSelectItems = this.#slottedSelectItems;
      if (slottedSelectItems) {
        const childPromises = slottedSelectItems.map(e => e.updateComplete);
        Promise.all(childPromises).then(() => {
          // Update the selected item, if it was pre-set.
          if (this.value) {
            this.#updateSelection(this.value);
            triggerEvent(this, CustomEvent, 'value-changed');
            triggerEvent(this, CustomEvent, 'valueChanged'); // #3599171
          }
        });
      }
    }

    this.handleInvalidEvent();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('value')) {
      // Update the selected item.
      this.#updateSelection(this.value);
      triggerEvent(this, CustomEvent, 'value-changed');
      triggerEvent(this, CustomEvent, 'valueChanged'); // #3599171
    }

    if (changedProperties.has('disableFiltering') || changedProperties.has('isTypeaheadSearch') || changedProperties.has('menuOpen')) {
      // Reset any filtering we may have done.
      const slottedSelectItems = this.#slottedSelectItems;
      if (slottedSelectItems) {
        DropdownUtilities.resetFilteredDropdownItems(slottedSelectItems);
      }
    }

    if (changedProperties.has('menuOpen')) {
      if (this.menuOpen) {
        // Close the dropdown if we don't have any items to display.
        if (this.#slottedSelectItems?.length < 1) {
          this.menuOpen = false;
        }
      } else if (!this.disableInputReset && !this.isTypeaheadSearch) {
        // Reset the input.
        const selectInput = this.#partRefs.input.value;
        if (selectInput) {
          selectInput.value = this.displayValue;
        }
      }
    }

    if (changedProperties.has('checkSelected')) {
      // When the style changes, notify child select items to update so that they can change their style.
      const childElementsToUpdate = this.querySelectorAll('otc-selectitem');
      childElementsToUpdate.forEach((element) => {
        element.requestUpdate?.();
      });
    }
  }

  #handleMenuIsOpenMutation() {
    // Ensure our `menuOpen` property stays in sync with the `isOpen` attribute on the `otc-menu`.
    const menuIsOpen = this.#partRefs.menu.value.isOpen;
    if (this.menuOpen !== menuIsOpen) {
      this.menuOpen = menuIsOpen;
    }
  }

  #handleMenuWrapperResize(entries) {
    entries.forEach(e => this.#partRefs.menu.value?.style.setProperty('--jatx-otc-menu-popover-width', `${e.target.clientWidth}px`));
  }

  #updateSelection(itemValue) {
    if (!itemValue) {
      // If the selection item value is blank, clear the selection.
      this.#clearSelection();
      return;
    }

    // Get the selected item.
    const slottedSelectItems = this.#slottedSelectItems;
    const selectedItem = slottedSelectItems.find(e => e.value === itemValue);

    if (selectedItem) {
      // Set the value of the input to match the selected item.
      const selectInput = this.#partRefs.input.value;
      if (selectInput) {
        selectInput.value = selectedItem.displayValue || selectedItem.innerText;
      }

      // Set the display value to match the selected item.
      this.displayValue = selectedItem.displayValue || selectedItem.innerText;
      this.initInternalsForm(selectedItem.value);

      // Loop through all of our slotted otc-selectitem or otc-selectuseritem elements, setting the selected property of the currently
      // selected item to true and the selected attribute of all other items to false.
      for (const element of slottedSelectItems) {
        if (element.matches(this.#selectItemTypeSelector)) {
          element?.updateComplete?.then(() => {
            element.selected = element.value === selectedItem.value;
          });
        }
      }
    } else {
      // If the value of the item does not match one of our slotted children, reset the selection.
      this.#clearSelection();
    }
  }

  #clearSelection() {
    // Clear the value of the input.
    const selectInput = this.#partRefs.input.value;
    if (selectInput) {
      selectInput.value = '';
    }

    // Clear the display value.
    this.displayValue = '';
    this.setInternalsFormValue('');

    // Reset the selected property of all our slotted otc-selectitem or otc-selectuseritem elements, unless they have not yet finished
    // their first update.  In that case, they may have an explicit selected property set in the HTML that we don't want to overwrite.
    const slottedSelectItems = this.#slottedSelectItems;
    if (slottedSelectItems) {
      for (const element of slottedSelectItems) {
        if ((element.tagName === 'OTC-SELECTITEM'
              || element.tagName === 'OTC-SELECTEXTENSIBLEITEM'
              || element.tagName === 'OTC-SELECTUSERITEM')
          && element.hasUpdated) {
          element.updateComplete.then(() => {
            element.selected = false;
          });
        }
      }
    }
  }

  /**
   * An API, which allows getting the select input value from outside the select component.
   *
   * @returns {string}
   * @internal
   */
  get selectInputValue() {
    return this.#partRefs.input.value?.value ?? '';
  }

  /**
   * Returns an array of elements assigned to the default slot of this component.
   *
   * @returns {Element[]}
   * @internal
   */
  get #slottedElements() {
    return this.#partRefs.slot.value?.assignedElements({ flatten: true });
  }

  /**
   * Returns an array of otc-selectitem elements assigned to the default slot of this component or as children of elements assigned to the
   * default slot of this component.
   *
   * @returns {Element[]}
   * @internal
   */
  get #slottedSelectItems() {
    return this.#slottedElements?.flatMap((element) => {
      const selectElement = element.matches(this.#selectItemTypeSelector) ? element : element.querySelector(this.#selectItemTypeSelector);
      return selectElement ?? [];
    });
  }

  #handleDropdownClick(event) {
    if (!this.disabled && !this.readonly && !event.target.matches('otc-menu')) {
      // Close the dropdown.
      this.menuOpen = false;

      // Dispatch a `change` event since this happened interactively.
      this.triggerChangeEvent();
    }
  }

  #handleDropdownKeyDown(event) {
    if (!this.disabled && !this.readonly) {
      switch (event.key) {
        case 'Enter':
        case 'Spacebar':
        case ' ':
          // Handle Enter or Spacebar as if we clicked the item.
          this.#handleDropdownClick(event);

          // Focus on the input.
          FocusUtilities.focusElement(this.#partRefs.input.value);

          break;

        // no default
      }
    }
  }

  #handleSlotChange() {
    const slottedSelectItems = this.#slottedSelectItems;

    if (slottedSelectItems && slottedSelectItems.length <= 0) {
      // Close the dropdown if we don't have any items to display.
      this.menuOpen = false;
    }

    // Only change the selected value if it was not already selected through the otc-select value attribute.
    if (this.value === '') {
      if (slottedSelectItems) {
        // Get the slotted elements where the selected attribute is set.
        const selectedItems = slottedSelectItems.filter(element => element.selected);

        if (selectedItems.length > 0) {
          // Preselect the first item that has the selected attribute set.
          this.value = selectedItems[0].value;
        }
      }
    }
  }

  #handleComboboxButtonClick() {
    if (!this.disabled && !this.readonly) {
      this.menuOpen = !this.menuOpen;
    }
  }

  #handleInput() {
    // Open the dropdown.
    this.menuOpen = true;

    // Reset any previous filtered items.
    const slottedSelectItems = this.#slottedSelectItems;
    if (slottedSelectItems) {
      DropdownUtilities.resetFilteredDropdownItems(slottedSelectItems);

      // Filter the displayed items based on the current input value.
      const selectInput = this.#partRefs.input.value;
      if (selectInput) {
        DropdownUtilities.filterDropdownItems(slottedSelectItems, selectInput.value);
      }
    }
  }

  #handleInputFocusout() {
    if (this.disableInputReset || this.isTypeaheadSearch) {
      return;
    }

    // Reset the input.
    const selectInput = this.#partRefs.input.value;
    if (selectInput) {
      selectInput.value = this.displayValue;
    }
  }

  #getResetSelectionItemTemplate() {
    const resetItemText = `- ${this.noneLabel} -`;
    if (!this.disableNoneOption) {
      return html`<otc-selectitem ariaLabel="${this.noneAriaLabel}" id="otc-select-none" isResetSelectionItem>${resetItemText}</otc-selectitem>`;
    }

    return html``;
  }

  #getInputTemplate() {
    return html`<otc-input ${n(this.#partRefs.input)} autocomplete="${this.autocomplete?.length > 0 ? this.autocomplete : nothing}" class="ot-select--combobox-input" ?disabled="${this.disabled}" id="select-input" interactiveOnly label="${this.label}" ?liveValidation="${this.liveValidation}" .placeholder="${this.placeholder}" ?readonly="${this.readonly}" ?required="${this.required}" role="combobox" .value="${this.displayValue}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" aria-labelledby="${this.getAriaLabelledByRenderValue()}" aria-controls="select-dropdown-menu" aria-describedby="${this.getAriaDescribedByRenderValue()}" aria-expanded="${this.menuOpen}" aria-haspopup="menu" @input="${this.disableFiltering || this.isTypeaheadSearch ? nothing : this.#handleInput}" @focusout="${this.#handleInputFocusout}"></otc-input>`;
  }

  #getButtonTemplate() {
    return html`<button aria-hidden="true" class="ot-select--combobox-button" ?disabled="${this.disabled}" id="select-combobox-button" tabindex="-1" @click="${this.#handleComboboxButtonClick}"><otc-icon isPresentation size="16px" svg="${actionChevronLargeDown}"></otc-icon></button>`;
  }

  #getMenuTemplate() {
    return html`<otc-menu ${n(this.#partRefs.menu)} ariaLabel="${this.label}" ariaRole="listbox" buttonId="select-input" ?disableAnimation="${this.disableAnimation}" id="select-dropdown-menu" isSelect ?isOpen="${this.menuOpen}" isWide maxItems="${this.maxItems}" ?usePopover="${this.usePopover}" scrollable @click="${this.#handleDropdownClick}" @keydown="${this.#handleDropdownKeyDown}" @slotchange="${this.#handleSlotChange}">${this.#getResetSelectionItemTemplate()}<slot ${n(this.#partRefs.slot)}></slot></otc-menu>`;
  }

  render() {
    return html`<div id="select-form" class="${e$1(this.getCommonFormClasses())}">${this.renderLabel('select-input')}<div class="ot-select--combobox-wrapper" role="none">${this.#getInputTemplate()} ${(this.readonly || this.#slottedElements?.length <= 0) ? nothing : this.#getButtonTemplate()}</div><div ${n(this.#partRefs.menuWrapper)} class="ot-select--menu-wrapper" role="none">${this.#getMenuTemplate()}</div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-select')) {
  customElements.define('otc-select', OtcSelect);
}

export { OtcSelect };
//# sourceMappingURL=otcSelect.js.map
