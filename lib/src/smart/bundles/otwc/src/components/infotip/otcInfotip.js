/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { actionHelpCircle } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { PopoverUtilities } from '../../utilities/popover-utilities.js';
import componentStyleSheet from './otcInfotip.scss.js';
import commonStyleSheet from '../../styles/common.scss.js';
import { ElementBase } from '../element-base.js';
import { ICON_BUNDLE_ACTION } from '../../utilities/render-utilities.js';
import { ThemeController } from '../../controllers/themeController.js';
import { RTLController } from '../../controllers/rtlController.js';
import { Interactive } from '../interactive.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Infotip component is a clickable button used for displaying additional information.<br>
 * Note: The infotip component is still in experimental state and not ready for productive use. <br>
 * @prop {string} ariaLabel The aria-label of the infotip.
 * @prop {boolean} isOpen Handles the open and close event of the infotip.
 * @prop {string} openingDirection Handles the initial opening direction of the infotext (start(left), top, bottom).
 * @slot infotext This defines the content of the additional information being displayed.
 */

class OtcInfoTip extends Interactive(ElementBase) {
  #themeController = new ThemeController(this);

  #rtlController = new RTLController(this);

  #partRefs = {
    button: e(),
    wrapper: e(),
    arrow: e(),
  };

  #removeMoveHandler;

  #layoutOffsets;

  #boundDocumentClickHandler = this.#handleDocumentClick.bind(this);

  static get styles() {
    return [componentStyleSheet, commonStyleSheet];
  }

  static get properties() {
    return {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      isOpen: {
        type: Boolean,
        reflect: true,
      },
      openingDirection: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.isOpen = false;
    this.openingDirection = '';
  }

  /**
   * Get the native button element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    const button = this.#partRefs.button.value;
    return button.shadowRoot.querySelector('button');
  }

  async updated() {
    this.#resetAutoUpdate();
    if (this.isOpen) {
      this.#computeOffsets();
      await this.#positionFlyout();
      this.#setupAutoUpdate();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('click', this.#boundDocumentClickHandler);

    if (this.isOpen) {
      this.#resetAutoUpdate();
      this.#setupAutoUpdate();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.#boundDocumentClickHandler);
    this.#resetAutoUpdate();
  }

  #resetAutoUpdate() {
    if (this.#removeMoveHandler) {
      this.#removeMoveHandler();
      this.#removeMoveHandler = undefined;
    }
  }

  #setupAutoUpdate() {
    const button = this.#partRefs.button.value;
    const wrapper = this.#partRefs.wrapper.value;
    this.#removeMoveHandler = PopoverUtilities.autoUpdate(button, wrapper, () => this.#positionFlyout());
  }

  #handleButtonKeyDown(event) {
    switch (event.key) {
      case 'Escape':
      case 'Esc':
        // If the infotext is open, close it
        if (this.isOpen) {
          this.isOpen = false;
          event.stopPropagation();
        }
        break;
      case 'Enter':
        this.#handleButtonClick();
        event.preventDefault();
        break;
      // no default
    }
  }

  #handleButtonClick() {
    this.isOpen = !this.isOpen;
  }

  #handleFocusOut() {
    this.isOpen = false;
  }

  #handleDocumentClick(event) {
    if (!this.contains(event.target) && !this.shadowRoot.contains(event.target)) {
      this.isOpen = false;
    }
  }

  #computeOffsets() {
    // to make the variable overridable in style sheet we could use main slot
    // const element = this.querySelector('[slot="main"]') || this.#partRefs.flyoutRoot.value;
    const element = this.#partRefs.wrapper.value;

    const [
      layoutOffset,
      flyoutOffset,
      buttonOffset,
    ] = PopoverUtilities.getComputedPropertyValues(element, [
      '--otc-infotip-layout-offset',
      '--otc-infotip-flyout-offset',
      '--otc-infotip-button-offset',
    ]);
    this.#layoutOffsets = { layoutOffset, flyoutOffset, buttonOffset };
  }

  async #positionFlyout() {
    const button = this.#partRefs.button.value;
    const flyout = this.#partRefs.wrapper.value;
    const arrow = this.#partRefs.arrow.value;
    const prefix = 'ot-infotip';
    const options = {
      // todo: really pass a css prefix?
      cssPrefix: prefix,
      isRTL: this.#rtlController.isRTL,
      openingDirection: this.openingDirection,
      ...this.#layoutOffsets,
    };
    await PopoverUtilities.positionFlyout(button, flyout, arrow, options);
  }

  render() {
    const infotipClasses = {
      flyout: {
        'ot--is-hidden': !this.isOpen,
        'otc-info-tip__flyout': true,
      },

      nose: {
        'ot--is-hidden': !this.isOpen,
        'otc-into-tip_flyout-nose': true,
      },
    };

    let infotipButton = nothing;
    if (this._themeIsCarbonFiber) {
      // Render button with CarbonFiber Icon.
      const icon = `${ICON_BUNDLE_ACTION}:action_infotip32`;
      infotipButton = html`<otc-button ${n(this.#partRefs.button)} @click="${this.#handleButtonClick}" @keydown="${this.#handleButtonKeyDown}" @focusout="${this.#handleFocusOut}" arialabel="${this.ariaLabel}" icon="${icon}"></otc-button>`;
    } else {
      // Render button with JATO Icon.
      const svg = `${actionHelpCircle}`;
      infotipButton = html`<otc-button ${n(this.#partRefs.button)} @click="${this.#handleButtonClick}" @keydown="${this.#handleButtonKeyDown}" @focusout="${this.#handleFocusOut}" ariaLabel="${this.ariaLabel}" size="small"><otc-icon svg="${svg}"></otc-icon></otc-button>`;
    }

    return html`<div class="otc-info-tip__container">${infotipButton}<div ${n(this.#partRefs.wrapper)} class="otc-info-tip__root"><div class="${e$1(infotipClasses.flyout)}" role="alert"><slot name="infotext"></slot></div><div ${n(this.#partRefs.arrow)} class="${e$1(infotipClasses.nose)}"><div class="otc-into-tip_flyout-nose-inner"></div></div></div></div>`;
  }
}

customElements.define('otc-info-tip', OtcInfoTip);

export { OtcInfoTip };
//# sourceMappingURL=otcInfotip.js.map
