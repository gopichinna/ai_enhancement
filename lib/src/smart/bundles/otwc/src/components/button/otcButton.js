/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from './otcButton.scss.js';
import { ElementBase } from '../element-base.js';
import { Interactive } from '../interactive.js';
import { shouldRenderIcon, getSVGForIcon, getClassesForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Button component represents a clickable button.
 * The otc-button might need additional aria attributes to implement correct a11y in some usecases.
 * To facilitate this we observe the otc-button for attributes starting with "aria" (without the -, so eg. "ariahaspopup") and map these
 * into the shadow-dom with corrected names. Not having the actual aria attributes on the host avoids issues with a11y checkers and tools.
 * @prop {string} ariaLabel The aria-label of the button.
 * @prop {boolean} dark The dark state of the button.
 * @prop {boolean} disabled The disabled state of the button.
 * @prop {boolean} emphasis Emphasizes the icon (if specified).  This can be used to advertise a default action.
 * @prop {boolean} headerItem Indicates that the button is part of a Header Bar.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {string} iconAppearance Specifies the icon appearance (theme) of the button.
 * @prop {string} image A data URI representing an image.<br>**Note:** The `image` property is only used in combination with `headerItem`.
 * @prop {boolean} menuOpen Indicates that the button is associated with a menu that is currently open.
 * @prop {boolean} signIn Styles the button as a "Sign In" button.
 * @prop {string} size The size of button.  `micro` and `mini` apply to primary and secondary buttons.  `small` applies to `inline` buttons.
 * @prop {boolean} toggled The toggled state of the icon (if specified).
 * @prop {string} type The type of button. When using button in a form, the type of button can be set to submit, reset or button.
 * The button will behave like a native button with type="submit", type="reset" or type="button".
 * <br>**Note:** - When setting type to submit. The button will look like a primary button.
 * <br> - When setting type to reset. The button will look like a secondary button.
 * <br> - When setting type to button. The button will look like a button without specific styling.
 * @slot unnamed Defines the label of the button.<br>**Note:** It is strongly recommended that you only use text or \`otc-icon\` in order to
 * preserve the intended design.
 * @slot count Defines the `otc-badge` that will be overlaid onto the button icon.
 */
class OtcButton extends Interactive(ElementBase) {
  #ariaAttributesMutationObserver = new MutationObserver(this.#handleAriaAttributeMutation.bind(this));

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
    ];
  }

  static get formAssociated() {
    return true;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
    this.#ariaAttributesMutationObserver.observe(this, { attributes: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#ariaAttributesMutationObserver.disconnect();
  }

  static get properties() {
    return {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      dark: {
        type: Boolean,
        reflect: true,
      },
      disabled: {
        type: Boolean,
        reflect: true,
      },
      emphasis: {
        type: Boolean,
        reflect: true,
      },
      headerItem: {
        type: Boolean,
        reflect: true,
      },
      icon: {
        type: String,
        reflect: true,
      },
      iconAppearance: {
        type: String,
        reflect: true,
      },
      image: {
        type: String,
        reflect: true,
      },
      menuOpen: {
        type: Boolean,
        reflect: true,
      },
      signIn: {
        type: Boolean,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
      toggled: {
        type: Boolean,
        reflect: true,
      },
      type: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.internals = this.attachInternals();

    this.ariaLabel = '';
    this.dark = false;
    this.disabled = false;
    this.emphasis = false;
    this.headerItem = false;
    this.icon = '';
    this.iconAppearance = '';
    this.image = '';
    this.menuOpen = null;
    this.signIn = false;
    this.size = '';
    this.toggled = false;
    this.type = '';

    this.addEventListener('click', this._handleClick);
  }

  /**
   * Get the native button element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this._button;
  }

  get _button() {
    return this.shadowRoot?.querySelector('button');
  }

  get _slottedNodes() {
    const nodes = this._button?.querySelector('slot')?.assignedNodes();
    if (nodes) {
      // Remove any all-whitespace text nodes.
      return nodes.filter(node => (node.nodeName !== '#text') || (node.textContent.trim() !== ''));
    }

    return nodes;
  }

  firstUpdated() {
    // Set the border-radius of the web component to match that of the inner button.  Otherwise, there would be an area of whitespace
    // outside of the inner button that would still be clickable.
    const button = this._button;
    if (button) {
      const borderRadius = window.getComputedStyle(this._button)['border-radius'];
      this.style.borderRadius = borderRadius;
    }
    // reflect the initial aria attributes to the native button
    this.getAttributeNames().forEach((attrName) => {
      this.#handleArriaAttr(attrName);
    });
  }

  #isLeadingIcon() {
    const slottedNodes = this._slottedNodes;
    return this.type !== 'inline'
      && (slottedNodes?.at(0)?.nodeName === 'OTC-ICON')
      && (slottedNodes?.at(1)?.nodeName === '#text');
  }

  #isTrailingIcon() {
    const slottedNodes = this._slottedNodes;
    return this.type !== 'inline'
      && (slottedNodes?.at(-1)?.nodeName === 'OTC-ICON')
      && (slottedNodes?.at(-2)?.nodeName === '#text');
  }

  #isInlineTextBulkSelection() {
    const slottedNodes = this._slottedNodes;
    return this.type === 'inline'
      && (slottedNodes?.at(-1)?.nodeName === 'OTC-BADGE')
      && (slottedNodes?.at(-2)?.nodeName === '#text');
  }

  #isInlineTextDropdown() {
    const slottedNodes = this._slottedNodes;
    return this.type === 'inline'
      && (slottedNodes?.at(-1)?.nodeName === 'OTC-ICON')
      && (slottedNodes?.at(-2)?.nodeName === '#text');
  }

  #isIconOnly() {
    const slottedNodes = this._slottedNodes;
    return (slottedNodes?.length === 1) && slottedNodes?.at(0)?.matches?.('otc-icon, img, svg');
  }

  _handleClick(event) {
    // If the button is disabled, then ignore the event and stop it from propagating.
    // Else if the button is integrated in a form tag, then trigger submit to the form.
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else if (this.internals.form && this.type === 'submit') {
      this.internals.form.requestSubmit();
    } else if (this.internals.form && this.type === 'reset') {
      this.internals.form.reset();
    }
  }

  _handleSlotChange() {
    const slottedNodes = this._slottedNodes;

    slottedNodes.forEach((node) => {
      if (node.nodeName === 'OTC-ICON') {
        node.updateComplete?.then(() => {
          node.disableEffects = true;
        });
      }
    });
  }

  #handleAriaAttributeMutation(mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        this.#handleArriaAttr(mutation.attributeName);
      }
    }
  }

  // copy the ariaXYZ attributes to the native element, using the appropriate name
  #handleArriaAttr(hostAttrName) {
    // we do not handle actual "aria-XYZ" attributes
    if (!hostAttrName.startsWith('aria') || hostAttrName.startsWith('aria-')) {
      return;
    }
    const ariaName = `aria-${hostAttrName.substring(4)}`;
    const currentlyExists = this.hasAttribute(hostAttrName);
    if (currentlyExists) {
      const currentValue = this.getAttribute(hostAttrName);
      this._button.setAttribute(ariaName, currentValue);
    } else {
      this._button.removeAttribute(ariaName);
    }
  }

  #getIconHTML() {
    if (shouldRenderIcon(this)) {
      return getSVGForIcon(this.icon, this.image);
    }
    return html``;
  }

  #getTypeSpecificClasses() {
    const classes = {
      'ot-btn': true,
      'ot--is-width-100': true,
      'ot--is-height-100': shouldRenderIcon(this),
      'ot-btn--is-dark': this.dark,
      'ot-btn--is-menu-open': this.menuOpen, // The menuOpen property is controlled by otcMenu.js
      'ot-btn--reduced-padding-end': this.#isTrailingIcon(),
      'ot-btn--reduced-padding-start': this.#isLeadingIcon(),
      'ot-btn--remove-padding': this.#isIconOnly(),
      'ot-pl-1--is-half-step': this.#isIconOnly(),
      'ot-pr-1--is-half-step': this.#isIconOnly(),
      'ot-btn--is-sign-in': this.signIn,
      'ot-btn--is-micro': this.size === 'micro',
      'ot-btn--is-mini': this.size === 'mini',
      'ot-btn--is-small': this.size === 'small',
      'ot-btn--is-inline-text': this.type === 'inline',
      'ot-btn--is-inline-text-bulk-selection': this.#isInlineTextBulkSelection(),
      'ot-btn--is-inline-text-dropdown': this.#isInlineTextDropdown(),
      'ot-btn--is-primary': this.type === 'primary' || this.type === 'submit',
      'ot-btn--is-secondary': this.type === 'secondary' || this.type === 'reset',
    };
    return { ...classes, ...getClassesForIcon(this) };
  }

  render() {
    const classes = this.#getTypeSpecificClasses();
    return html`<div class="ot-btn__container"><button ?disabled="${this.disabled}" class="${e(classes)}" aria-expanded="${this.menuOpen ?? nothing}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" .id="${this.id}">${this.#getIconHTML()}<slot @slotchange="${this._handleSlotChange}"></slot><slot name="count"></slot></button></div>`;
  }
}

customElements.define('otc-button', OtcButton);

export { OtcButton };
//# sourceMappingURL=otcButton.js.map
