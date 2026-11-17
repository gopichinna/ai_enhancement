/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcRadio.scss.js';
import { FormGroup } from '../form-group.js';
import { FormBase } from '../form-base.js';
import { RadioGroupController } from './RadioGroupController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Radio Group component is a container holding `otc-radio` components, while allowing only a single option to be selected at a time.
 * @prop {number} columns The number of columns to render when using horizontal rendering.  Up to 12 columns can be specified.
 * @prop {string} name The name of the radio group.  All radio items with this unique name are treated as members of the same group.
 * @prop {string} value The value of the selected radio.
 * @slot unnamed Defines the `otc-radio` elements that are contained in the group.
 */
class OtcRadioGroup extends FormGroup {
  constructor() {
    super();

    this.columns = 1;
    this.name = '';
    this.value = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      FormBase.getFormStyles(),
      styleSheet,
    ];
  }

  static get properties() {
    const props = {
      columns: { type: Number, reflect: true },
      name: { type: String, reflect: true },
      value: { type: String, reflect: true },
    };

    return { ...FormGroup._groupProperties, ...props };
  }

  firstUpdated(changedProperties) {
    super.firstUpdated?.(changedProperties);

    this.initInternalsForm(this.value);
  }

  render() {
    const self = this;

    const radioOptionClasses = {
      'ot-radio-options': true,
      'ot-grid--is-1-columns': this.columns === 1,
      'ot-grid--is-2-columns': this.columns === 2,
      'ot-grid--is-3-columns': this.columns === 3,
      'ot-grid--is-4-columns': this.columns === 4,
      'ot-grid--is-5-columns': this.columns === 5,
      'ot-grid--is-6-columns': this.columns === 6,
      'ot-grid--is-7-columns': this.columns === 7,
      'ot-grid--is-8-columns': this.columns === 8,
      'ot-grid--is-9-columns': this.columns === 9,
      'ot-grid--is-10-columns': this.columns === 10,
      'ot-grid--is-11-columns': this.columns === 11,
      'ot-grid--is-12-columns': this.columns >= 12,
    };

    return html`<div class="${e(this.getCommonFormClasses())}">${this.renderLabel(this.id, true)}<div id="${this.id}" class="ot-radio-group" role="radiogroup" aria-label="${this.ariaLabel ? this.ariaLabel : this.label}" aria-required="${this.getAriaRequiredRenderValue()}" aria-invalid="${this.getAriaInvalidRenderValue()}" aria-errormessage="${this.getAriaErrorMessage()}" aria-describedby="${this.getAriaDescribedByRenderValue()}"><div class="${e(radioOptionClasses)}"><slot @slotchange="${(event) => { self._onSlotChange.call(self, event); }}"></slot></div>${this.renderErrorMessage(this.validationMessage)} ${this.renderInfoMessage()}</div><slot class="otc-default-slot"></slot></div>`;
  }

  _onSlotChange(event) {
    const slot = event.target;
    // propagate the name attribute to each slot element that is a otc-radio
    let haveFocusable = false;
    const slottedRadioButtons = [];
    slot.assignedElements().forEach(
      (elem) => {
        if (elem.tagName === 'OTC-RADIO') {
          if (!this.name) {
            const radioGroupController = RadioGroupController.getController(elem);
            this.name = radioGroupController.getUniqueId('r');
          }
          slottedRadioButtons.push(elem);
          elem.setAttribute('name', this.name);

          // only set the radio buttons to disabled if the whole group is marked disabled in markup
          if (this.disabled) {
            elem.disabled = true;
          }

          // propagate the readonly down to the elements
          if (this.readonly) {
            elem.setAttribute('readonly', '');
          }

          // propagate the readonly down to the elements
          if (this.required) {
            elem.setAttribute('required', '');
          }

          // make the first non disabled element focusable by setting tabindex
          if (!elem.disabled && elem.checked) {
            haveFocusable = true;
            this.value = elem.value;
          }

          if (elem.checked) {
            this.setInternalsFormValue(this.value);
          }

          elem.addEventListener('change', async (changeEvent) => {
            if (this.value === changeEvent.detail.value) {
              return; // skip triggering event if value did not change
            }

            this.value = changeEvent.detail.value;
            this.setInternalsFormValue(this.value);

            await this.updateComplete;
            this.triggerChangeEvent();
          });
        }
      },
    );
    if (!haveFocusable && slottedRadioButtons.length > 0) {
      slottedRadioButtons[0].isFocusable = true;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._attributeChangedCallback) {
      return;
    }

    this._attributeChangedCallback = true;

    switch (name) {
      case 'disabled':
        this._propagateAttributeChangeToItems('disabled', newValue);
        if (newValue === '') { // null if disabled not set, "" if disabled is specified
          // if focus was at this element, unfocus it by calling blur
          this.blur();
        }
        break;
      case 'readonly':
        this._propagateAttributeChangeToItems('readonly', newValue);
        break;
    }

    super.attributeChangedCallback(name, oldValue, newValue);
    this._attributeChangedCallback = false;
  }

  _propagateAttributeChangeToItems(attributeName, attributeValue) {
    const radioButtonElements = this.querySelectorAll(`otc-radio[name="${this.name}"]`);
    if (attributeValue === '') { // null if attribute is not set or "" if attribute is specified
      // set the disabled attribute at all radio button items
      for (const radioButtonElement of radioButtonElements) {
        radioButtonElement.setAttribute(attributeName, '');
      }
    } else {
      // remove the disabled attribute
      for (const radioButtonElement of radioButtonElements) {
        radioButtonElement.removeAttribute(attributeName);
      }
    }
  }
}

if (!customElements.get('otc-radiogroup')) {
  customElements.define('otc-radiogroup', OtcRadioGroup);
}

export { OtcRadioGroup };
//# sourceMappingURL=otcRadioGroup.js.map
