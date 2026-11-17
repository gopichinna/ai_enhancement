import { nothing, html } from 'lit';
import { actionRemoveXs, actionCheckmarkSelect } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { triggerEvent } from '../../utilities/common-utilities.js';
import { ThemeController } from '../../controllers/themeController.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
* The checkbox base implements methods common to both the `otc-checkbox` component and the `otc-menucheckbox` component.
*/
const OtcCheckboxBase = superClass => class extends superClass {
  #themeController = new ThemeController(this);

  #partRefs = {
    input: e(),
  };

  /** @internal */
  static get properties() {
    return { ...ThemeController.properties };
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#handleClick);
    this.addEventListener('keydown', this.#handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.#handleKeydown);
    this.removeEventListener('click', this.#handleClick);
  }

  #handleClick(event) {
    if (event.composedPath().some(e => e.matches && e.matches('.ot-checkbox'))) {
      this.click();
    }
  }

  #handleKeydown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        this.click();
        break;

      // no default
    }
  }

  #handleInputKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Spacebar':
      case ' ':
        // Prevent the default checkbox handling as we will handle it at the web component level.
        event.preventDefault();
        break;

      // no default
    }
  }

  click() {
    if (!this.disabled && !this.readonly) {
      this.checked = !this.checked;
      this.indeterminate = false;

      triggerEvent(this, Event, 'input');
      triggerEvent(this, Event, 'change');
    }
  }

  #getIconTemplate() {
    // Am unchecked and not indeterminate checkbox does not use any icon
    if (!this.indeterminate && !this.checked) {
      return nothing;
    }
    let svgString;
    if (this.indeterminate) {
      svgString = actionRemoveXs;
    } else {
      svgString = actionCheckmarkSelect;
    }
    const frag = document.createRange().createContextualFragment(`${svgString}`);
    const svg = frag.querySelector('svg');
    svg.setAttribute('width', 14);
    svg.setAttribute('height', 14);

    // remove any fill property
    const childElements = svg.querySelectorAll('path, circle');
    childElements.forEach((el) => {
      el.removeAttribute('fill');

      // remove all fill styles
      const styleObj = el.style;
      // eslint-disable-next-line no-plusplus
      for (let i = styleObj.length; i--;) {
        const nameString = styleObj[i];
        if (nameString === 'fill') {
          styleObj.removeProperty(nameString);
        }
      }
    });

    return html`${frag}`;
  }

  #getLabelTemplate(inputId) {
    return html`<label class="ot-checkbox__text" for="${inputId || nothing}"><slot></slot></label>`;
  }

  /**
   * Generates the template for the input element of the checkbox component.
   * @param {Object} args The input arguments.
   * @param {Boolean} args.checked The checked state of the input.
   * @param {Boolean} args.disabled The disabled state of the input.
   * @param {String} args.id The id of the input.
   * @param {Boolean} args.indeterminate The indeterminate state of the input.
   * @param {String} args.name The name of the input.
   * @param {Boolean} args.required The required state of the input.
   * @param {String} args.type The type of the input.
   * @param {Boolean} args.readonly The readonly state of the input.
   * @param {String} args.ariaDescribedBy The aria-describedby of the input.
   * @param {String} args.ariaErrorMessage The aria-errormessage of the input.
   * @param {String} args.ariaInvalid The aria-invalid of the input.
   * @param {String} args.ariaLabel The aria-label of the input.
   * @param {Boolean} args.ariaRequired The aria-required of the input.
   * @param {Boolean} args.hidden The hidden state of the input.
   * @returns {TemplateResult} The template for the input element of the checkbox component
   * @internal
   */
  getInputTemplate(args) {
    return html`<input ${n(this.#partRefs.input)} .checked="${args.checked}" ?disabled="${args.disabled}" id="${args.id}" .indeterminate="${args.indeterminate ?? nothing}" name="${args.name ?? nothing}" ?required="${args.required}" type="${args.type}" aria-readonly="${args.readonly ? 'true' : nothing}" aria-describedby="${args.ariaDescribedBy ?? nothing}" aria-errormessage="${args.ariaErrorMessage ?? nothing}" aria-invalid="${args.ariaInvalid ?? nothing}" aria-label="${(args.ariaLabel?.length > 0) ? args.ariaLabel : nothing}" aria-required="${args.ariaRequired ?? nothing}" ?hidden="${args.hidden ?? nothing}" @keydown="${this.#handleInputKeyDown}">`;
  }

  /**
   * Generates the template for the input element of the checkbox component.
   * @param inputId The id of the input.
   * @returns {TemplateResult} The template for the checkbox wrapper element of the checkbox component
   * @internal
   */
  getCheckboxWrapperTemplate(inputId) {
    const classes = {
      'ot-checkbox__icon': true,
      'ot-checkbox__icon--jato': !this._themeIsCarbonFiber,
    };
    return html`<div class="ot-checkbox__icon-container"><span class="${e$1(classes)}">${this.#getIconTemplate()}</span></div>${this.interactiveOnly ? nothing : this.#getLabelTemplate(inputId)}`;
  }
};

export { OtcCheckboxBase };
//# sourceMappingURL=otcCheckboxBase.js.map
