/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { nothing, html } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import brandStyleSheet from './otcBrand.scss.js';
import brandJatoStyleSheet from './otcBrandJato.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Brand component consists of an image of the logo, the vertical splitter and the Primary product name.
 * Additionally, users can add some secondary text and the version number.
 * @prop {string} align The alignment of the logo and text elements.
 * @prop {string} ariaLabel Defines the aria-label of the brand.
 * @prop {boolean} dark Display the Brand with a dark background.
 * @prop {boolean} disabled Disable click interaction with the logo.
 * @prop {boolean} hidePrimaryText Hide the primary text.
 * @prop {boolean} hideSecondaryText Hide the secondary text.
 * @prop {boolean} hideVersionText Hide the version text.
 * @prop {boolean} large Display the Brand in a large size.
 * @prop {string} logoAltText The alternative text for the logo image.
 * @prop {string} logoSrc The location of the logo image.
 * @prop {string} logoUrl The destination URL when clicking on the brand. The brand is not active unless this is set.
 * @prop {string} logoUrlTarget The target to open from the linked brand. The value will be propagated as link target.
 * @prop {boolean} noBrandText Display the brand without any text components (primary, secondary and version text). This helps
 * to support a smaller screen width by just altering one property. This property is used by Header Bar to hide and show the text
 * components. The default is `false`.
 * @prop {string} primaryText The primary text of brand.
 * @prop {string} secondaryText The secondary text of brand.
 * @prop {string} tooltipBrand The tooltip of the brand.
 * @prop {string} versionText The version text of brand.
*/
class OtcBrand extends ElementBase {
  #imageLoaded = undefined;

  #imageFailed = undefined;

  #themeController = new ThemeController(this);

  /**
   * A promise that resolves when the logo specified in `logoSrc` has finished loading.
   * @internal
   */
  imageComplete = new Promise((resolve, reject) => {
    this.#imageLoaded = resolve;
    this.#imageFailed = reject;
  });

  constructor() {
    super();

    this.align = '';
    this.ariaLabel = '';
    this.dark = false;
    this.disabled = false;
    this.hidePrimaryText = false;
    this.hideSecondaryText = false;
    this.hideVersionText = false;
    this.large = false;
    this.logoAltText = '';
    this.logoSrc = '';
    this.logoUrl = '';
    this.logoUrlTarget = '';
    this.noBrandText = false;
    this.primaryText = '';
    this.secondaryText = '';
    this.tooltipBrand = '';
    this.versionText = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      brandStyleSheet,
      brandJatoStyleSheet,
    ];
  }

  static get properties() {
    return {
      ...ThemeController.properties,
      align: { type: String, reflect: true },
      ariaLabel: { type: String, reflect: true },
      dark: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      hidePrimaryText: { type: Boolean, reflect: true },
      hideSecondaryText: { type: Boolean, reflect: true },
      hideVersionText: { type: Boolean, reflect: true },
      large: { type: Boolean, reflect: true },
      logoAltText: { type: String, reflect: true },
      logoSrc: { type: String, reflect: true },
      logoUrl: { type: String, reflect: true },
      logoUrlTarget: { type: String, reflect: true },
      noBrandText: { type: Boolean, reflect: true },
      primaryText: { type: String, reflect: true },
      secondaryText: { type: String, reflect: true },
      tooltipBrand: { type: String, reflect: true },
      versionText: { type: String, reflect: true },
    };
  }

  _hasLogoUrl() {
    return (this.logoUrl === null) ? false : (this.logoUrl.length > 0);
  }

  connectedCallback() {
    super.connectedCallback();

    // get the obligatory logo
    const img = this.shadowRoot.querySelector('img');
    // add event listeners to resolve the imageComplete promise
    img.addEventListener('load', () => this.#imageLoaded());
    img.addEventListener('error', () => {
      if (this.logoSrc?.length > 0) {
        this.#imageFailed(new Error(`Loading the image from '${this.logoSrc}' failed.`));
      } else {
        // if no logoSrc given, return success for backward compatibility,
        // otherwise everyone must use Promise.allSettled() to catch the rejected
        this.#imageLoaded();
      }
    });
  }

  // helper to get state of promise
  _promiseState(p) {
    const t = {};
    // eslint-disable-next-line no-confusing-arrow
    return Promise.race([p, t]).then(v => (v === t) ? 'pending' : 'fulfilled', () => 'rejected');
  }

  async updated(changedProperties) {
    if (changedProperties.has('logoSrc')) {
      if (this.logoSrc) {
        // get the obligatory logo
        const img = this.shadowRoot.querySelector('img');
        // check if image is already loaded, but promise not resolved;
        // happens when image was already cached by browser
        const promiseState = await this._promiseState(this.imageComplete);
        if (promiseState === 'pending' && img.complete) {
          this.#imageLoaded();
        }
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case 'logoSrc':
      case 'logosrc':
        if ((!oldValue && !newValue) || (oldValue === newValue)) break;
        // recreate the promise
        this.imageComplete = new Promise((resolve, reject) => {
          this.#imageLoaded = resolve;
          this.#imageFailed = reject;
        });
        break;
    }
  }

  #isOldBrand() {
    return this._themeIsCarbonFiber || this.large || this.align || this.dark;
  }

  #getTypeSpecificClassesOld() {
    return {
      'ot-brand': true,
      'ot-brand--is-dark': this.dark,
      'ot-brand--is-large': this.large,
      'ot-brand--is-stacked-centered': this.align === 'center',
      'ot-brand--is-stacked-left': this.align === 'left',
      'ot-brand--is-disabled': this.disabled,
      'ot-brand--is-link': !this.disabled && this._hasLogoUrl(),
    };
  }

  #getTypeSpecificClasses() {
    return {
      'ot-brand-jato': true,
      'ot-brand-jato--no-brand-text': this.noBrandText,

      'ot-brand-jato--is-disabled': this.disabled, // just for info
      'ot-brand--is-link': !this.disabled && this._hasLogoUrl(),
    };
  }

  render() {
    let typeClasses;
    if (this.#isOldBrand()) {
      typeClasses = this.#getTypeSpecificClassesOld();
    } else {
      typeClasses = this.#getTypeSpecificClasses();
    }

    if (!this.disabled && this._hasLogoUrl()) {
      return html`<a class="${e(typeClasses)}" title="${this.tooltipBrand.length > 0 ? this.tooltipBrand : nothing}" href="${this.logoUrl}" target="${this.logoUrlTarget.length > 0 ? this.logoUrlTarget : nothing}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}">${this._getLogoElement()} ${this._getDividerElement()} ${this._getTextElements()}</a>`;
    }
    return html`<div class="${e(typeClasses)}" title="${this.tooltipBrand.length > 0 ? this.tooltipBrand : nothing}" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}">${this._getLogoElement()} ${this._getDividerElement()} ${this._getTextElements()}</div>`;
  }

  _getDividerElement() {
    if (this.#isOldBrand()) {
      if (this.hideSecondaryText && this.hidePrimaryText && this.hideVersionText) {
        return html``;
      }

      if (this.primaryText.length || this.secondaryText.length || this.versionText.length) {
        return html`<div class="ot-brand__divider"></div>`;
      }
    }
    // with Jato there is no divider
    return html``;
  }

  _getLogoElement() {
    if (this.#isOldBrand()) {
      return html`<span class="ot-brand__logo"><img class="ot-brand__logo-img" alt="${this.logoAltText}" src="${this.logoSrc}"></span>`;
    }
    const logoClasses = {
      'ot-brand-jato__logo': true,
    };
    return html`<span class="${e(logoClasses)}"><img class="ot-brand-jato__logo-img" alt="${this.logoAltText}" src="${this.logoSrc}"></span>`;
  }

  _isOnlyLogo() {
    return this.noBrandText || (this.hideSecondaryText && this.hidePrimaryText && this.hideVersionText);
  }

  _getTextElements() {
    if (this.#isOldBrand()) {
      if (this.align === 'left') {
        return html`<div class="ot-flex ot-flex--is-column">${this._getMainTextElements()} ${this._getSubTextElements()}</div>`;
      }

      return html`${this._getMainTextElements()} ${this._getSubTextElements()}`;
    }
    // if all is hidden then do not render anything otherwise the gap is applied
    if (this._isOnlyLogo()) {
      return html``;
    }
    return html`<span class="ot-brand-jato__text-components">${this._getMainTextElements()} ${this._getSubTextElements()}</span>`;
  }

  _getSubTextElements() {
    if (this.align === 'center' || this.align === 'left') {
      return html`<div class="ot-flex ot-flex--is-row ot-flex--is-v-centered">${this._getSecondaryAndVersionText()}</div>`;
    }

    return this._getSecondaryAndVersionText();
  }

  _getMainTextElements() {
    if (this.align === 'center' || this.align === 'left') {
      return html`<div class="ot-flex ot-flex--is-row ot-flex--is-v-centered">${this._getPrimaryText()}</div>`;
    }

    return this._getPrimaryText();
  }

  _getPrimaryText() {
    if (this.#isOldBrand()) {
      return html`${!this.hidePrimaryText ? html`<div class="ot-brand__primary">${this.primaryText}</div>` : html``}`;
    }
    return html`${!this.hidePrimaryText ? html`<div class="ot-brand-jato__primary">${this.primaryText}</div>` : html``}`;
  }

  _getSecondaryAndVersionText() {
    if (this.#isOldBrand()) {
      return html`${!this.hideSecondaryText ? html`<div class="ot-brand__secondary">${this.secondaryText}</div>` : html``} ${!this.hideVersionText ? html`<div class="ot-brand__version">${this.versionText}</div>` : html``}`;
    }
    return html`${!this.hideSecondaryText ? html`<div class="ot-brand-jato__secondary">${this.secondaryText}</div>` : html``} ${!this.hideVersionText ? html`<div class="ot-brand-jato__version">${this.versionText}</div>` : html``}`;
  }
}

if (!customElements.get('otc-brand')) {
  customElements.define('otc-brand', OtcBrand);
}

export { OtcBrand };
//# sourceMappingURL=otcBrand.js.map
