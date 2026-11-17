/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import { illustrationsServerErrorXsmall } from '../../../node_modules/@jato/svgs/dist/index.esm.js';
import { OtcMenuItemBase } from './otcMenuItemBase.js';
import { animatedMoreSVG, OTC_ICON_BUNDLE_WC_ILLUSTRATIONS } from '../../utilities/render-utilities.js';
import otcMenuPlaceholderStyles from './otcMenuPlaceholder.scss.js';
import { ThemeController } from '../../controllers/themeController.js';
import '../../../lib/otc-icons/icons_otc-action.js';
import '../../../lib/otc-icons/icons_otc-illustrations.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Menu Placeholder component can be used to display a progress indicator or error message when a menu is displayed before the menu
 * items have been loaded.
 * @prop {string} errorText The text displayed on the error screen.
 * @prop {string} loadingText The text displayed on the loading screen
 * @prop {boolean} showError Determines if the placeholder should display the error screen instead of the loading screen.
 * @prop {boolean} simple Determines if the placeholder should display a simplified placeholder, with just the loading icon visible.
 * @slot errorButton An `otc-button` component that is displayed on the error screen.
 * @slot errorIcon An `otc-icon` component that is displayed on the error screen.
 * @slot loadingIcon An `otc-icon` component that is displayed on the loading screen.
 */
class OtcMenuPlaceholder extends OtcMenuItemBase {
  #themeController = new ThemeController(this);

  #slotNames = {
    errorButton: 'errorButton',
    errorIcon: 'errorIcon',
    loadingIcon: 'loadingIcon',
  };

  #placeholderLoadingWrapperId = 'otc-placeholder-loading-wrapper';

  #placeholderErrorWrapperId = 'otc-placeholder-error-wrapper';

  static get styles() {
    return [...OtcMenuItemBase.styles, otcMenuPlaceholderStyles];
  }

  static get properties() {
    const props = {
      errorText: { type: String, reflect: true },
      loadingText: { type: String, reflect: true },
      showError: { type: Boolean, reflect: true },
      simple: { type: Boolean, reflect: true },
    };

    return { ...ThemeController.properties, ...OtcMenuItemBase.properties, ...props };
  }

  constructor() {
    super();

    this.errorText = 'Unable to load the content.';
    this.loadingText = 'This might take a moment...';
    this.showError = false;
    this.simple = false;
  }

  #getLoadingIconSlotTemplate() {
    return html`<slot name="${this.#slotNames.loadingIcon}"><otc-icon svg="${animatedMoreSVG}" type="secondary" isPresentation></otc-icon></slot>`;
  }

  #getLoadingTemplate() {
    const placeholderWrapper = {
      'otc-menu-placeholder__wrapper': true,
      'otc-menu-placeholder__wrapper--is-loading': true,
      'otc-menu-placeholder__is-visible': !this.showError,
      'otc-menu-placeholder__is-not-visible': this.showError,
    };

    return html`<div id="${this.#placeholderLoadingWrapperId}" class="${e(placeholderWrapper)}"><span class="otc-menu-placeholder__loading-icon">${this.#getLoadingIconSlotTemplate()} </span><span class="otc-menu-placeholder__text otc-menu-placeholder__loading-text-fade-in-anim">${this.loadingText}</span></div>`;
  }

  #getErrorTemplate() {
    const placeholderWrapperClasses = {
      'otc-menu-placeholder__wrapper': true,
      'otc-menu-placeholder__wrapper--is-error': true,
      'otc-menu-placeholder__is-visible': this.showError,
      'otc-menu-placeholder__is-not-visible': !this.showError,
    };

    return html`<div id="${this.#placeholderErrorWrapperId}" class="${e(placeholderWrapperClasses)}"><span class="otc-menu-placeholder__error-icon"><slot name="${this.#slotNames.errorIcon}"><otc-icon icon="${this._themeIsCarbonFiber ? `${OTC_ICON_BUNDLE_WC_ILLUSTRATIONS}:ill_server_error220` : nothing}" isPresentation svg="${!this._themeIsCarbonFiber ? illustrationsServerErrorXsmall : nothing}" type="primary"></otc-icon></slot></span><span class="otc-menu-placeholder__text">${this.errorText}</span> <span class="otc-menu-placeholder__error-button"><slot name="${this.#slotNames.errorButton}"></slot></span></div>`;
  }

  render() {
    if (this.simple) {
      return html`<li class="otc-menu-placeholder-simple" role="menuitem" tabindex="-1">${this.#getLoadingIconSlotTemplate()}</li>`;
    }

    // In order to support the transition animations specified in the UXD, we need to render both the loading template and the error
    // template at the same time.  They both have `position: absolute` so that they are rendered directly on top of each other.  We use
    // `opacity`, which hides the element visually, and `visibility`, which hides the element from accessibility, to control which template
    // is shown based on the `showError` property.  The transitions are setup on the `opacity` and `visibility` attributes.  We also add a
    // `transition-delay` to the template that is becoming visible, i.e. has the class `otc-menu-placeholder__is-visible` at this point, so
    // that the fade out of the old template has finished before the fade in of the new template starts.
    return html`<li class="otc-menu-placeholder" role="menuitem" tabindex="-1" aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}">${this.#getErrorTemplate()} ${this.#getLoadingTemplate()}</li>`;
  }
}

customElements.define('otc-menuplaceholder', OtcMenuPlaceholder);

export { OtcMenuPlaceholder };
//# sourceMappingURL=otcMenuPlaceholder.js.map
