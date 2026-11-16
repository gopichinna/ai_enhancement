/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { LitElement, html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import componentStyleSheet from './otcAvatar.scss.js';
import { ElementBase } from '../element-base.js';
import { OTC_ICON_BUNDLE_WC_HEADER, getSVGForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Avatar component is a round element that displays either an image, an icon from one of the icon bundles, or user initials.
 * @prop {string} ariaLabel The `aria-label` associated with an interactive avatar component. This should include the initials, if shown.
 * @prop {string} iconAppearance Specifies the icon appearance (theme) of the avatar component.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. header:header_user42. @deprecated - the icon property
 * will be removed with version 24.4. The default avatar is displayed if no icon, image and initials are specified.
 * @prop {string} image A data URI representing an image.
 * @prop {string} initials A string containing the user initials.
 * @prop {boolean} interactive Determines if this avatar should be interactive like a button, including the addition of hover/focus effects.
 */
class OtcAvatar extends ElementBase {
  static get styles() {
    // Default size as defined in UX : https://uxd.opentext.net/guidelines/header_web_user_menu_visdspec_21_web.htm
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
      componentStyleSheet,
    ];
  }

  static get properties() {
    return {
      ariaLabel: {
        type: String,
        reflect: true,
      },
      iconAppearance: {
        type: String,
        reflect: true,
      },
      icon: {
        type: String,
        reflect: true,
      },
      image: {
        type: String,
        reflect: true,
      },
      initials: {
        type: String,
        reflect: true,
      },
      interactive: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  static get shadowRootOptions() {
    return {
      ...LitElement.shadowRootOptions,
      // If the user clicks somewhere to the shadow DOM, focus the inner
      // interactive element and enable CSS pseudo-classes detecting the focused
      // state on the host element too.
      delegatesFocus: true,
    };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.iconAppearance = '';
    this.icon = '';
    this.image = '';
    this.initials = '';
    this.interactive = false;
  }

  #getIconTemplate() {
    if (!this.icon && !this.image && !this.initials) {
      // use the default user avatar icon in case no icon, image or initials are specified
      this.icon = `${OTC_ICON_BUNDLE_WC_HEADER}:header_user42`;
    }
    return getSVGForIcon(this.icon, this.image, this.initials);
  }

  #getClasses() {
    const classes = {
      'ot-btn': this.interactive,
      'ot--is-width-100': this.interactive,
      'ot--is-header-item': true,
      'ot-icon': true,
      'ot-icon--is-header-icon-user': true,
      'ot-icon--is-styleable-icon': this.interactive,
    };
    if (this.iconAppearance) {
      classes[`ot-icon--appearance-${this.iconAppearance}`] = true;
    }
    return classes;
  }

  #getNonInteractiveTemplate() {
    return html`${this.#getIconTemplate()}`;
  }

  #getInteractiveTemplate() {
    return html`<button aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(this.#getClasses())}" id="avatar-button">${this.#getIconTemplate()}</button>`;
  }

  render() {
    return html`${this.interactive ? this.#getInteractiveTemplate() : this.#getNonInteractiveTemplate()}`;
  }
}

if (!customElements.get('otc-avatar')) {
  customElements.define('otc-avatar', OtcAvatar);
}

export { OtcAvatar };
//# sourceMappingURL=otcAvatar.js.map
