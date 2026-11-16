import { html, nothing } from 'lit';
import { FormElement } from '../form-element.js';
import { FormBase } from '../form-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcSelect.scss.js';
import dropDownStyleSheet from '../../styles/dropdown.scss.js';
import { DropdownUtilities } from '../../utilities/dropdown-utilities.js';
import { FocusUtilities } from '../../utilities/focus-utilities.js';
import { OtcMenu } from '../menu/otcMenu.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Select component represents a dropdown list of items for the user to choose from.
 * @prop {boolean} caretRightSpacingLarge Reposition the caret icon.  Used by `otc-multivalue` to prevent overlap with its icons.
 * @prop {boolean} checkSelected Toggle checkmark styling of the select items.
 * @prop {string} displayValue The display value of the select.
 * @prop {number} maxItems The maximum number of items to display in the dropdown before scrolling is enabled.
 * @prop {boolean} menuOpen Indicates that the button is associated with a menu that is currently open.
 * @prop {string} noneAriaLabel Defines the aria-label of the item in the dropdown that will reset the selection.
 * @prop {string} noneLabel Defines the text of the item in the dropdown that will reset the selection.
 * @prop {string} placeholder Defines the placeholder text of the input.
 * @prop {boolean} showNone Controls whether or not to add an item to the dropdown that will reset the selection.
 * @prop {string} value The value of the selected item.
 * @slot unnamed Defines the content of the menu.
 * **Note:** It is strongly recommended that you only use `otc-selectitem` or `otc-selectuseritem` components in order to preserve the
 * intended design.
 * @fires change Fired when the value of the select has changed.
 */
class OtcSelect extends FormElement {
  static get styles() {
    return [
      commonStyleSheet,
      dropDownStyleSheet,
      FormBase.getFormStyles(),
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      caretRightSpacingLarge: { type: Boolean, reflect: true },
      checkSelected: { type: Boolean, reflect: true },
      displayValue: { type: String, reflect: false },
      maxItems: { type: Number, reflect: true },
      menuOpen: { type: Boolean, reflect: true },
      noneAriaLabel: { type: String, reflect: true },
      noneLabel: { type: String, reflect: true },
      placeholder: { type: String, reflect: true },
      showNone: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
    };

    return { ...FormElement._commonProperties, ...props };
  }

  constructor() {
    super();

    this.caretRightSpacingLarge = false;
    this.checkSelected = false;
    this.displayValue = '';
    this.maxItems = 20;
    this.menuOpen = false;
    this.noneAriaLabel = 'Reset Selection';
    this.noneLabel = 'None';
    this.placeholder = '';
    this.showNone = true;
    this.value = '';
  }

  firstUpdated(changedProperties) {
    if (changedProperties.has('value')) {
      // Our child items might not have finished being created yet.  We need them to be finished so that we can find the item that matches
      // our "value" property.  We will wait to call "#updateSelection" until all child elements have finished being created.
      const slottedElements = this.#slottedElements;
      if (slottedElements) {
        const childPromises = slottedElements.map(e => e.updateComplete);
        Promise.all(childPromises).then(() => {
          // Update the selected item.
          this.#updateSelection(this.value);
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

      // Dispatch a 'change' event
      this.triggerChangeEvent();
    }

    if (changedProperties.has('menuOpen')) {
      if (!this.menuOpen) {
        // Reset any filtering we may have done.
        const slottedElements = this.#slottedElements;
        if (slottedElements) {
          DropdownUtilities.resetFilteredDropdownItems(slottedElements);
        }

        // Reset the input.
        const selectInput = this._selectInput;
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

  #updateSelection(itemValue) {
    // Get the selected item.
    let selectedItem;
    const slottedElements = this.#slottedElements;
    if (slottedElements) {
      selectedItem = slottedElements.find(e => e.value === itemValue);
    }

    if (selectedItem) {
      // Set the value of the input to match the selected item.
      const selectInput = this._selectInput;
      if (selectInput) {
        selectInput.value = selectedItem.displayValue || selectedItem.innerText;
      }

      // Set the display value to match the selected item.
      this.displayValue = selectedItem.displayValue || selectedItem.innerText;
      this.initInternalsForm(selectedItem.value);

      // Loop through all of our slotted otc-selectitem or otc-selectuseritem elements, setting the selected property of the currently
      // selected item to true and the selected attribute of all other items to false.
      for (const element of slottedElements) {
        if (['OTC-SELECTITEM', 'OTC-SELECTUSERITEM'].indexOf(element.tagName) !== -1) {
          element?.updateComplete?.then(() => {
            element.selected = element.value === selectedItem.value;
          });
        }
      }
    } else {
      // If the value of the item does not match one of our slotted children, reset the selection.
      this._clearSelection();
    }
  }

  _clearSelection() {
    // Clear the  value of the input.
    const selectInput = this._selectInput;
    if (selectInput) {
      selectInput.value = '';
    }

    // Clear the display value.
    this.displayValue = '';
    this.setInternalsFormValue('');

    // Reset the selected property of all our slotted otc-selectitem or otc-selectuseritem elements, unless they have not yet finished
    // their first update.  In that case, they may have an explicit selected property set in the HTML that we don't want to overwrite.
    const slottedElements = this.#slottedElements;
    if (slottedElements) {
      for (const element of slottedElements) {
        if ((element.tagName === 'OTC-SELECTITEM' || element.tagName === 'OTC-SELECTUSERITEM') && element.hasUpdated) {
          element.updateComplete.then(() => {
            element.selected = false;
          });
        }
      }
    }
  }

  get _selectCombobox() {
    if (this.shadowRoot) {
      return this.shadowRoot.getElementById('select-combobox');
    }

    return null;
  }

  get _selectInput() {
    if (this.shadowRoot) {
      return this.shadowRoot.getElementById('select-input');
    }

    return null;
  }

  get _dropdownMenu() {
    if (this.shadowRoot) {
      const dropdownMenu = this.shadowRoot.getElementById('select-dropdown-menu');
      // This check seems unnecessary, but we need to use the imported 'OtcMenu' in some way so that it doesn't get optimized out.
      if (dropdownMenu instanceof OtcMenu) {
        return dropdownMenu;
      }
    }

    return null;
  }

  get #slottedElements() {
    const dropdownMenu = this._dropdownMenu;
    if (dropdownMenu) {
      const dropdownSlot = dropdownMenu.querySelector('slot');
      if (dropdownSlot) {
        return dropdownSlot.assignedElements();
      }
    }

    return null;
  }

  get _resetSelectionItem() {
    if (this.shadowRoot) {
      return this.shadowRoot.getElementById('otc-select-none');
    }

    return null;
  }

  _getAllChildren() {
    const allChildren = [];

    const resetSelectionItem = this._resetSelectionItem;
    if (resetSelectionItem) {
      allChildren.push(resetSelectionItem);
    }

    const slottedElements = this.#slottedElements;
    if (slottedElements) {
      allChildren.push(...slottedElements);
    }

    return allChildren;
  }

  _handleComboboxClick(event) {
    if (!this.disabled && !this.readonly) {
      if (event.target === this._selectCombobox) {
        if (this.menuOpen) {
          // Close the dropdown.
          this.menuOpen = false;
        } else {
          // Open the dropdown.
          this.menuOpen = true;
        }

        // We handled the event, so stop it from propagating to the input.
        event.stopPropagation();
      }

      if (event.target === this._selectInput) {
        // Open the dropdown.
        this.menuOpen = true;

        // We handled the event, so stop it from propagating to the menu.
        event.stopPropagation();
      }
    }
  }

  _handleDropdownClick(event) {
    if (!this.disabled && !this.readonly) {
      // Close the dropdown.
      this.menuOpen = false;

      // Focus on the input.
      const selectInput = this._selectInput;
      if (selectInput) {
        selectInput.focus();
      }

      // We handled the event, so stop it from propagating to the combobox.
      event.stopPropagation();
    }
  }

  _handleInput() {
    // Open the dropdown.
    this.menuOpen = true;

    // Reset any previous filtered items.
    const slottedElements = this.#slottedElements;
    if (slottedElements) {
      DropdownUtilities.resetFilteredDropdownItems(slottedElements);

      // Filter the displayed items based on the current input value.
      const selectInput = this._selectInput;
      if (selectInput) {
        DropdownUtilities.filterDropdownItems(slottedElements, selectInput.value);
      }
    }
  }

  _handleInputFocus() {
    this._selectCombobox.classList.add('ot-select--is-active');
  }

  _handleInputBlur() {
    if (!this.menuOpen) {
      this._selectCombobox.classList.remove('ot-select--is-active');
    }
  }

  _handleComboboxKeyDown(event) {
    if (!this.disabled && !this.readonly) {
      switch (event.key) {
        case 'Escape':
        case 'Esc':
          // Close the dropdown.
          this.menuOpen = false;
          break;

        case 'ArrowDown': {
          // Stop the window from scrolling.
          event.preventDefault();

          // Open the dropdown.
          this.menuOpen = true;

          // Focus the first item.
          FocusUtilities.focusFirstItem(this._getAllChildren());

          // Stop the event from propagating.
          event.stopPropagation();

          break;
        }

        case 'Alt':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'CapsLock':
        case 'Control':
        case 'Shift':
        case 'Tab':
          // These keys should not open the menu by themselves.
          break;

        default:
          // Open the dropdown.
          this.menuOpen = true;

          // Stop the event from propagating.
          event.stopPropagation();

          break;
      }
    }
  }

  _handleDropdownKeyDown(event) {
    if (!this.disabled && !this.readonly) {
      switch (event.key) {
        case 'Enter':
        case 'Spacebar':
        case ' ':
          // Stop the event from typing in the input field.
          event.preventDefault();

          // Handle Enter or Spacebar as if we clicked the item.
          this._handleDropdownClick(event);
          break;

        // no default
      }
    }
  }

  _handleSlotChange() {
    // Only change the selected value if it was not already selected through the otc-select value attribute.
    if (this.value === '') {
      const slottedElements = this.#slottedElements;
      if (slottedElements) {
        // Get the slotted elements where the selected attribute is set.
        const selectedItems = slottedElements.filter(element => element.selected);

        if (selectedItems.length > 0) {
          // Preselect the first item that has the selected attribute set.
          this.value = selectedItems[0].value;
        }
      }
    }
  }

  _getActiveElement() {
    if (document.activeElement.shadowRoot) {
      return document.activeElement.shadowRoot.activeElement;
    }

    return document.activeElement;
  }

  _getResetSelectionItemTemplate() {
    const resetItemText = `- ${this.noneLabel} -`;
    if (this.showNone) {
      return html`<otc-selectitem isResetSelectionItem="true" id="otc-select-none" ariaLabel="${this.noneAriaLabel}">${resetItemText}</otc-selectitem>`;
    }

    return html``;
  }

  render() {
    const dropdownClasses = {
      'ot-dropdown': true,
      'ot-dropdown--is-active': this.menuOpen,
    };

    const selectClasses = {
      'ot-select': true,
      'ot-select--caret-inset-inline-end-1': this.caretRightSpacingLarge,
      'ot-select--is-active': this.menuOpen || this._getActiveElement() === this._selectInput,
      'ot-select--is-disabled': this.disabled,
      'ot-select--is-readonly': this.readonly,
    };

    return html`<div id="select-form" class="${e(this.getCommonFormClasses())}">${this.renderLabel('select-combobox')}<div id="select-dropdown" class="${e(dropdownClasses)}"><div id="select-combobox" class="${e(selectClasses)}" role="combobox" aria-controls="select-dropdown-menu" aria-disabled="${this.disabled}" aria-expanded="${this.menuOpen}" aria-haspopup="menu" aria-label="${this.ariaLabel}" aria-labelledby="${this.ariaLabel ? nothing : this.getAriaLabelledByRenderValue()}" aria-readonly="${this.readonly}" aria-required="${this.required}" @click="${this._handleComboboxClick}" @keydown="${this._handleComboboxKeyDown}"><input id="select-input" .value="${this.displayValue}" .placeholder="${this.placeholder}" ?disabled="${this.disabled}" ?readonly="${this.readonly}" ?required="${this.required}" @input="${this._handleInput}" @focus="${this._handleInputFocus}" @blur="${this._handleInputBlur}" aria-label="${this.ariaLabel}" aria-labelledby="${this.ariaLabel ? nothing : this.getAriaLabelledByRenderValue()}"></div></div><div class="ot-select--menu-wrapper"><otc-menu ariaLabel="${this.label}" ariaRole="listbox" buttonId="${this.id}" id="select-dropdown-menu" ?isOpen="${this.menuOpen}" isWide maxItems="${this.maxItems}" scrollable @click="${this._handleDropdownClick}" @keydown="${this._handleDropdownKeyDown}" @slotchange="${this._handleSlotChange}">${this._getResetSelectionItemTemplate()}<slot></slot></otc-menu></div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-select')) {
  customElements.define('otc-select', OtcSelect);
}

export { OtcSelect };
//# sourceMappingURL=otcSelect.js.map
