import { html, nothing } from 'lit';
import { ElementBase } from '../element-base.js';
import commonStyleSheet from '../../styles/common.scss.js';
import styleSheet from './otcBrand.scss.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Brand component consists of an image of the logo, vertical splitter and Primary product name.
 * Additionally, users can add some secondary text such as CE.
 * @prop {string} align The alignment of the logo and text elements.
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
 * @prop {string} primaryText The primary text of brand.
 * @prop {string} secondaryText The secondary text of brand.
 * @prop {string} tooltipBrand The tooltip of the brand.
 * @prop {string} versionText The version text of brand.
*/
class OtcBrand extends ElementBase {
  #imageLoaded = undefined;

  #imageFailed = undefined;

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
    this.primaryText = '';
    this.secondaryText = '';
    this.tooltipBrand = '';
    this.versionText = '';
  }

  static get styles() {
    return [
      commonStyleSheet,
      styleSheet,
    ];
  }

  static get properties() {
    return {
      align: { type: String, reflect: true },
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

  render() {
    const typeClasses = {
      'ot-brand--is-dark': this.dark,
      'ot-brand--is-large': this.large,
      'ot-brand--is-stacked-centered': this.align === 'center',
      'ot-brand--is-stacked-left': this.align === 'left',
      'ot-brand--is-disabled': this.disabled,
      'ot-brand--is-link': !this.disabled && this._hasLogoUrl(),
    };

    if (!this.disabled && this._hasLogoUrl()) {
      return html`<a class="ot-brand ${e(typeClasses)}" title="${this.tooltipBrand.length > 0 ? this.tooltipBrand : nothing}" href="${this.logoUrl}" target="${this.logoUrlTarget.length > 0 ? this.logoUrlTarget : nothing}">${this._getLogoElement()} ${this._getDividerElement()} ${this._getTextElements()}</a>`;
    }
    return html`<div class="ot-brand ${e(typeClasses)}" title="${this.tooltipBrand.length > 0 ? this.tooltipBrand : nothing}">${this._getLogoElement()} ${this._getDividerElement()} ${this._getTextElements()}</div>`;
  }

  _getDividerElement() {
    if (this.hideSecondaryText && this.hidePrimaryText && this.hideVersionText) {
      return html``;
    }

    if (this.primaryText.length || this.secondaryText.length || this.versionText.length) {
      return html`<div class="ot-brand__divider"></div>`;
    }

    return html``;
  }

  _getLogoElement() {
    return html`<span class="ot-brand__logo"><img class="ot-brand__logo-img" alt="${this.logoAltText}" src="${this.logoSrc}"></span>`;
  }

  _getTextElements() {
    if (this.align === 'left') {
      return html`<div class="ot-flex ot-flex--is-column">${this._getMainTextElements()} ${this._getSubTextElements()}</div>`;
    }

    return html`${this._getMainTextElements()} ${this._getSubTextElements()}`;
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
    return html`${!this.hidePrimaryText ? html`<div class="ot-brand__primary">${this.primaryText}</div>` : html``}`;
  }

  _getSecondaryAndVersionText() {
    return html`${!this.hideSecondaryText ? html`<div class="ot-brand__secondary">${this.secondaryText}</div>` : html``} ${!this.hideVersionText ? html`<div class="ot-brand__version">${this.versionText}</div>` : html``}`;
  }
}

if (!customElements.get('otc-brand')) {
  customElements.define('otc-brand', OtcBrand);
}

export { OtcBrand };
//# sourceMappingURL=otcBrand.js.map
