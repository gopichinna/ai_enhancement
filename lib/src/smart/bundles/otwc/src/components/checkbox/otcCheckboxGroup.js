/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import checkboxStyleSheet from './otcCheckbox.scss.js';
import { FormGroup } from '../form-group.js';
import { FormBase } from '../form-base.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Checkbox Group component allows multiple selections from a set of options.
 * This type of group can not be set to required and thus has no livevalidation or error state.
 * @prop {number} columns The number of columns to render when using horizontal rendering.  Up to 12 columns can be specified.
 * @prop {boolean} horizontal Determines if the group is rendered horizontal or vertical.
 * @prop {object} value The currently selected item(s) of the group.
 * @slot unnamed Defines the `otc-checkbox` elements that are contained in the group.
 */
class OtcCheckboxGroup extends FormGroup {
  constructor() {
    super();

    this.columns = 1;
    this.horizontal = false;
    this.value = {};
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      checkboxStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      columns: { type: Number, reflect: true },
      horizontal: { type: Boolean, reflect: true },
      value: { type: Object, reflect: false },
    };

    return { ...FormGroup._groupProperties, ...props };
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    if (this.columns < 1) {
      this.columns = 1;
    }

    const checkboxes = this.querySelectorAll('otc-checkbox');
    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        this._captureChecked(checkbox);
      }
    }

    this.shadowRoot.querySelector('.ot-checkbox-group').addEventListener('change', (event) => {
      this._captureChecked(event.target);
      this.checkValidity();
      this.render();
    });
  }

  updated(changedProperties) {
    super.updated?.(changedProperties);

    if (changedProperties.has('readonly') && (this.readonly || (changedProperties.get('readonly') !== undefined))) {
      this._applyToAllCheckBoxes('readonly', this.readonly);
    }

    if (changedProperties.has('disabled') && (this.disabled || (changedProperties.get('disabled') !== undefined))) {
      this._applyToAllCheckBoxes('disabled', this.disabled);
    }
  }

  _applyToAllCheckBoxes(propertyName, value) {
    const checkboxes = this.querySelectorAll('otc-checkbox');

    for (const checkbox of checkboxes) {
      checkbox.updateComplete.then(() => {
        checkbox[propertyName] = value;
      });
    }
  }

  _handleSlotChange(event) {
    const elements = event.target.assignedElements();
    if (elements.length > 0) {
      for (const element of elements) {
        if (element.tagName === 'OTC-CHECKBOX') {
          element.updateComplete.then(() => {
            const formControlDiv = element.shadowRoot.querySelector('div.ot-form-control');
            if (formControlDiv) {
              formControlDiv.classList.remove('ot-form-control');
            }

            const errorTextP = element.shadowRoot.querySelector('p.ot-form-control__error-text');
            if (errorTextP) {
              errorTextP.style.display = 'none';
            }
          });
        }
      }
    }
  }

  _captureChecked(checkbox) {
    const key = checkbox.id;
    if (key in this.value) {
      delete this.value[key];
    } else {
      this.value[key] = 'checked';
    }
  }

  static get value() {
    return this.value;
  }

  render() {
    const numColumnsClass = ((this.columns < 1) ? 'ot-grid--is-1-columns' : `ot-grid--is-${this.columns}-columns`);

    const formClasses = {
      'ot-form-control--is-horizontal': this.horizontal,
    };

    return html`<div class="${e({ ...this.getCommonFormClasses(), ...formClasses })}">${this.renderLabel(this.id, true)}<div id="${this.id}" class="ot-checkbox-group" role="group" aria-label="${this.ariaLabel ? this.ariaLabel : this.label}" aria-describedby="${this.getAriaDescribedByRenderValue()}"><div class="ot-checkbox-options ${numColumnsClass}"><slot @slotchange="${this._handleSlotChange}"></slot></div></div>${this.renderInfoMessage()}</div>`;
  }
}

if (!customElements.get('otc-checkboxgroup')) {
  customElements.define('otc-checkboxgroup', OtcCheckboxGroup);
}

export { OtcCheckboxGroup };
//# sourceMappingURL=otcCheckboxGroup.js.map
