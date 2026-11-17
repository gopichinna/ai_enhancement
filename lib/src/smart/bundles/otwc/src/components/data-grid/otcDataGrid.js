/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import { actionEdit, actionCloseSmall, actionCheckmark } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import '../../../lib/otc-icons/icons_otc-action_small.js';
import { buildAttributesMarkup } from '../../utilities/common-utilities.js';
import { MODE_READ, MODE_EDIT, TAG_NAME_OTC_INPUT, TAG_NAME_OTC_TEXTAREA, TAG_NAME_OTC_SELECT, TAG_NAME_OTC_INPUT_DATE, TAG_NAME_OTC_CHECKBOX, TAG_NAME_OTC_RADIO_GROUP, TAG_NAME_OTC_CHECKBOX_GROUP, TAG_NAME_OTC_MULTI_VALUE } from '../../utilities/jsonParser/jsonParser.constants.js';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import styleSheet from './otcDataGrid.scss.js';
import { ElementBase } from '../element-base.js';
import { DataGridParser } from '../../utilities/jsonParser/dataGridParser.js';
import { CheckBoxModel } from '../../utilities/jsonParser/models/checkBoxModel.js';
import { MultiValueModel } from '../../utilities/jsonParser/models/multiValueModel.js';
import { getActionSmallAddButton, getActionSmallDeleteButton } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';
import { unsafeHTML as o } from '../../../node_modules/lit-html/directives/unsafe-html.js';

class OtcDataGrid extends ElementBase {
  /** @type {DataGridParser} */
  #dataGrid;

  #rowCount;

  #columnCount;

  #cellInEdit = false;

  static get styles() {
    return [
      iconStyleSheet,
      buttonStyleSheet,
      commonStyleSheet,
      styleSheet,
    ];
  }

  static get properties() {
    return {
      schema: { type: String, reflect: true },
      tableAriaLabel: { type: String, reflect: true },
      editLabel: { type: String, reflect: true },
      cancelLabel: { type: String, reflect: true },
      saveLabel: { type: String, reflect: true },
      addLabel: { type: String, reflect: true },
      removeLabel: { type: String, reflect: true },
      actionColumnLabel: { type: String, reflect: true },
      mode: {
        type: String,
        reflect: true,
        hasChanged() { return false; },
      },
    };
  }

  constructor() {
    super();
    this.schema = '';
    this.mode = MODE_READ;
    this.tabelAriaLabel = 'Edit';
    this.editLabel = 'Edit';
    this.cancelLabel = 'Cancel';
    this.saveLabel = 'Save';
    this.addLabel = 'Add';
    this.removeLabel = 'Remove';
    this.actionColumnLabel = '';
  }

  /**
   * Lit lifecycle method.
   *
   * @param changedProperties
   */
  willUpdate(changedProperties) {
    super.willUpdate(changedProperties);

    const gridParser = new DataGridParser();
    gridParser.init(this.mode, this.schema);

    this.#dataGrid = gridParser;
    this.#rowCount = gridParser.body.length;
    this.#columnCount = gridParser.header.length + 1; // The plus one is the action column.
  }

  /**
   * Lit lifecycle method.
   *
   * @returns {*}
   */
  render() {
    const classes = {
      'otc-data-grid': true,
      'otc-data-grid--is-edit-mode': this.mode === MODE_EDIT,
    };

    // TODO the existence of row-actions column will depend on the schema/data
    // TODO do not render the column unless in edit mode
    return html`<div class="${e(classes)}"><div class="otc-data-grid__table-wrapper"><table class="otc-data-grid__table" aria-label="${this.tabelAriaLabel}"><thead><tr>${this.#dataGrid.header.map(row => html`<th>${row.title}</th>`)}<th>${this.actionColumnLabel}</th></tr></thead><tbody>${this.#dataGrid.body.map((row, i) => this.#buildRowMarkup(row, i))}</tbody></table></div><div class="otc-data-grid__buttons"><div class="otc-data-grid__edit-btn-wrapper">${this.#getEditButtonMarkup()}</div><div class="otc-data-grid__save-cancel-btn-wrapper" hidden>${this.#getSaveButtonMarkup()} ${this.#getCancelButtonMarkup()}</div></div></div>`;
  }

  /**
   * Return all supported components for the grid.
   *
   * @returns {NodeListOf<Element>}
   */
  #getAllComponents() {
    const selector = `
      ${TAG_NAME_OTC_INPUT},
      ${TAG_NAME_OTC_TEXTAREA},
      ${TAG_NAME_OTC_SELECT},
      ${TAG_NAME_OTC_INPUT_DATE},
      ${TAG_NAME_OTC_CHECKBOX},
      ${TAG_NAME_OTC_RADIO_GROUP},
      ${TAG_NAME_OTC_CHECKBOX_GROUP},
      ${TAG_NAME_OTC_MULTI_VALUE}
    `;
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Switch between read and edit mode.
   * Get all components inside the grid and set or remove 'readonly' state.
   */
  #switchToEditMode() {
    this.mode = MODE_EDIT;
    this.#getAllComponents().forEach((component, index) => {
      if (component.parentElement.dataset.readonly === 'false') {
        component.removeAttribute('readonly');
      }
      if (index === 0) { // Set tabindex="0" to the first cell in the table to enable keyboard navigation on this cell.
        component.parentElement.setAttribute('tabindex', '0');
        setTimeout(() => component.parentElement.focus(), 0);
      }
    });

    this.shadowRoot.querySelector('.otc-data-grid').classList.add('otc-data-grid--is-edit-mode');
    this.shadowRoot.querySelector('.otc-data-grid__edit-btn-wrapper').hidden = true;
    this.shadowRoot.querySelector('.otc-data-grid__save-cancel-btn-wrapper').hidden = false;
    this.shadowRoot.querySelector('.otc-data-grid__save-cancel-btn-wrapper otc-button').focus();
  }

  /**
   * Switch between read and edit mode.
   * Get all components inside the grid and set or remove 'readonly' state.
   */
  #switchToReadMode() {
    this.mode = MODE_READ;
    this.#getAllComponents().forEach((component) => {
      component.setAttribute('readonly', '');
      // Set tabindex="-1" to disable keyboard navigation on all cells.
      component.parentElement.setAttribute('tabindex', '-1');
    });

    this.shadowRoot.querySelector('.otc-data-grid').classList.remove('otc-data-grid--is-edit-mode');
    this.shadowRoot.querySelector('.otc-data-grid__edit-btn-wrapper').hidden = false;
    this.shadowRoot.querySelector('.otc-data-grid__edit-btn-wrapper otc-button').focus();
    this.shadowRoot.querySelector('.otc-data-grid__save-cancel-btn-wrapper').hidden = true;
  }

  /**
   * Build the HTML markup for a table row. We add a dedicated column for the column-action-buttons.
   *
   * @param row
   * @param rowIndex Row index
   * @returns {*}
   */
  #buildRowMarkup(row, rowIndex) {
    return html`<tr data-y="${rowIndex + 1}">${row.map((cell, cellIndex) => html`<td data-x="${cellIndex + 1}" data-readonly="${!!cell.initReadonly}" tabindex="${(this.mode === MODE_EDIT && rowIndex === 0 && cellIndex === 0) ? '0' : '-1'}" @keydown="${this.#handleKeyboardNavigation}">${o(this.#buildCellMarkup(cell))}</td>`)}<td class="otc-data-grid__action-cell" data-x="${this.#columnCount}" data-readonly="false" data-action-cell="true" tabindex="-1" @keydown="${this.#handleKeyboardNavigation}"><div class="otc-data-grid__action-buttons">${this.#getAddRowButtonMarkup()} ${this.#getRemoveRowButtonMarkup()}</div></td></tr>`;
  }

  /**
   * Build the HTML markup for an element.
   *
   * @param model
   * @returns {string}
   */
  #buildCellMarkup(model, disableTab = true) {
    let markup = '';

    // Disable tab navigation for the component inside the data grid with tabindex = "-1".
    markup += `<${model.tagName} tabindex="${disableTab ? '-1' : '0'}" ${buildAttributesMarkup(model)}>`;

    // Build options markup for an element with options like otc-select or otc-radio.
    if (model.hasOptions) {
      markup += model.optionsMarkup;
    }

    // Single checkbox needs a label in the slot.
    if (model instanceof CheckBoxModel) {
      markup += `${model.label}`;
    }

    if (model instanceof MultiValueModel) {
      markup += '<template>';
      markup += this.#buildCellMarkup(model.child, false);
      markup += '</template>';
    }

    markup += `</${model.tagName}>`;

    return markup;
  }

  /**
   * Get edit button markup.
   *
   * @returns {*}
   */
  #getEditButtonMarkup() {
    return html`<otc-button @click="${this.#switchToEditMode}" class="otc-data-grid__cancel-button" ariaLabel="${this.editLabel}" title="${this.editLabel}"><otc-icon svg="${actionEdit}"></otc-icon></otc-button>`;
  }

  /**
   * Get cancel button markup.
   * @returns {*}
   */
  #getCancelButtonMarkup() {
    return html`<otc-button @click="${this.#switchToReadMode}" class="otc-data-grid__cancel-button" ariaLabel="${this.cancelLabel}" title="${this.cancelLabel}"><otc-icon svg="${actionCloseSmall}"></otc-icon></otc-button>`;
  }

  /**
   * Get save button markup.
   *
   * @returns {*}
   */
  #getSaveButtonMarkup() {
    return html`<otc-button @click="${this.#switchToReadMode}" class="otc-data-grid__save-button" ariaLabel="${this.saveLabel}" title="${this.saveLabel}"><otc-icon svg="${actionCheckmark}"></otc-icon></otc-button>`;
  }

  /**
   * Get add row button markup.
   * Action small button.
   *
   * @returns {*}
   */
  #getAddRowButtonMarkup() {
    return getActionSmallAddButton(
      this.addLabel,
      this.addLabel,
      () => {},
      'otc-data-grid__add-row-button',
      '-1',
    );
  }

  /**
   * Get remove row button markup.
   * Action small button.
   *
   * @returns {*}
   */
  #getRemoveRowButtonMarkup() {
    return getActionSmallDeleteButton(
      this.removeLabel,
      this.removeLabel,
      () => {},
      'otc-data-grid__remove-row-button',
      '-1',
    );
  }

  /**
   * Handling for keyboard navigation.
   *
   * @param event
   */
  #handleKeyboardNavigation(event) {
    const currentCell = event.currentTarget;
    const isActionCell = !!currentCell.dataset.actionCell;

    switch (event.key) {
      case 'Escape':
        this.#handleEscapeKeypress(event, currentCell, isActionCell);
        break;
      case 'Enter':
        this.#handleEnterKeypress(event, currentCell, isActionCell);
        break;
      case 'Tab':
        this.#handleTabKeypress(event, currentCell, isActionCell);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.#handleArrowKeyNavigation(event, currentCell);
        break;
    }
  }

  /**
   * Handling for keyboard navigation with TAB key press.
   *
   * @param event
   */
  #handleTabKeypress(event, currentCell, isActionCell) {
    const isMultiValue = event.target.tagName === 'OTC-MULTIVALUE';
    const isSelect = event.target.tagName === 'OTC-SELECT' || event.target.tagName === 'OTC-SELECTITEM';

    // When the focus is in a form element (otc-input, otc-select), then don't allow navigating.
    // User has to press Escape to get out of edit and then can navigate.
    if (!isActionCell && (event.target.tagName !== 'TD') && !isMultiValue && !isSelect) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (isMultiValue) {
      const { activeElement } = event.target.shadowRoot;
      const isFirstItem = activeElement.parentElement.classList.contains('ot-multi-value__first-item');
      const isLastItem = activeElement.parentElement.classList.contains('ot-multi-value__last-item');

      if (!event.shiftKey) {
        // If the multi-value has only one element, and the focus is on the "Add" button,
        // then set the focus back to the element
        if (isFirstItem && isLastItem && activeElement.classList.contains('ot-multi-value__add-button')) {
          event.stopPropagation();
          event.preventDefault();
          event.target.firstChildElement.focus();
        }
        // If the focus is on the "Remove" button of the last element,
        // then set the focus back to the first element.
        if (isLastItem && activeElement.classList.contains('ot-multi-value__remove-button')) {
          event.stopPropagation();
          event.preventDefault();
          event.target.firstChildElement.focus();
        }
      } else if (isFirstItem) { // If it's the shift tab case, and the focus is on the first element, then navigate to the last element.
        event.stopPropagation();
        event.preventDefault();
        event.target.shadowRoot.querySelector('.ot-multi-value__last-item').firstElementChild.focus();
      }

      return;
    }

    if (isSelect) {
      event.stopPropagation();
      event.preventDefault();
      // Set focus back to the input in otc-select, when pressing TAB on a select item.
      if (event.target.tagName === 'OTC-SELECTITEM') {
        event.target.parentElement.shadowRoot.querySelector('otc-input').focus();
      }
      return;
    }

    // Set focus back to the first element in action cell, when the focus is already on the remove row button.
    if (isActionCell && event.target.classList.contains('otc-data-grid__remove-row-button')) {
      currentCell.focus();
    }
  }

  /**
   * Handling for keyboard navigation with Escape key press.
   *
   * @param event
   */
  #handleEscapeKeypress(event, currentCell, isActionCell) {
    this.#cellInEdit = false; // Set the state to enable arrow navigation between table cells (see #handleArrowKeyNavigation).
    currentCell.focus();
    if (isActionCell) { // For action cell, disable the tab navigation (tabindex="-1") for all action buttons.
      currentCell.firstElementChild.firstElementChild.setAttribute('tabindex', '-1');
      currentCell.firstElementChild.lastElementChild.setAttribute('tabindex', '-1');
    } else if (currentCell.firstElementChild.tagName === 'OTC-MULTIVALUE') {
      // Disable tab navigation for all child elements in the multi-value.
      for (const element of currentCell.firstElementChild.getAllChildElements()) {
        element.setAttribute('tabindex', '-1');
      }
    }
  }

  /**
   * Handling for keyboard navigation with Enter key press.
   *
   * @param event
   */
  #handleEnterKeypress(event, currentCell, isActionCell) {
    // If the target is the form element (otc-input, otc-select...),
    // then don't interrupt their own logic for keyboard navigation.
    if (event.target.tagName !== 'TD') {
      return;
    }

    // For action cell, enable the tab navigation (tabindex="0") to enable tabbing between the action buttons.
    if (isActionCell) {
      currentCell.firstElementChild.firstElementChild.setAttribute('tabindex', '0');
      currentCell.firstElementChild.lastElementChild.setAttribute('tabindex', '0');
      currentCell.firstElementChild.firstElementChild.focus(); // Set focus on the first element (the add row button).
    } else if (currentCell.firstElementChild.tagName === 'OTC-MULTIVALUE') { // Focus on the first element of the component for edit.
      // Enable tab navigation for all child elements in the multi-value.
      for (const element of currentCell.firstElementChild.getAllChildElements()) {
        element.setAttribute('tabindex', '0');
      }
      currentCell.firstElementChild.firstChildElement.focus();
    } else if (currentCell.dataset.readonly === 'false') { // Focus on the element inside the TD for edit.
      this.#cellInEdit = true; // Set the state to avoid arrow navigation between table cells (see #handleArrowKeyNavigation).
      currentCell.firstElementChild.focus();
    }
  }

  /**
   * Handling for navigation inside the data grid with arrow keys.
   *
   * @param event
   */
  #handleArrowKeyNavigation(event, currentCell) {
    // If an element is in edit, then don't navigate.
    if (this.#cellInEdit) {
      return;
    }

    let nextX;
    let nextY;
    const currentX = Number(currentCell.dataset.x);
    const currentY = Number(currentCell.parentElement.dataset.y);

    switch (event.key) {
      case 'ArrowUp':
        if (currentY > 0) {
          nextX = currentX;
          nextY = currentY - 1;
        }
        break;
      case 'ArrowDown':
        if (currentY < this.#rowCount) { // Go to the cell below when the last row is not reached.
          nextX = currentX;
          nextY = currentY + 1;
        }
        break;
      case 'ArrowLeft':
        if (currentX > 0) {
          nextX = currentX - 1;
          nextY = currentY;
        }
        break;
      case 'ArrowRight':
        if (currentX < this.#columnCount) { // Go to the next cell on the right when the last row is not reached.
          nextX = currentX + 1;
          nextY = currentY;
        }
        break;
    }

    // Look for the TD element with the TR-TD coordination.
    const targetElement = this.shadowRoot.querySelector(`tr[data-y='${nextY}'] td[data-x='${nextX}']`);

    // If the element exists, then set focus on the element.
    if (targetElement) {
      currentCell.setAttribute('tabindex', '-1');
      targetElement.setAttribute('tabindex', '0');
      targetElement.focus();
    }
  }
}

if (!customElements.get('otc-data-grid')) {
  customElements.define('otc-data-grid', OtcDataGrid);
}

export { OtcDataGrid };
//# sourceMappingURL=otcDataGrid.js.map
