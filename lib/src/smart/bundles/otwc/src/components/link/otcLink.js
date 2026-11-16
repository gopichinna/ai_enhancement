/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import componentStyleSheet from './otcLink.scss.js';
import { ElementBase } from '../element-base.js';
import { Interactive } from '../interactive.js';
import { shouldRenderIcon, getSVGForIcon, getClassesForIcon } from '../../utilities/render-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Link component is a clickable text element used for navigation.
 * @prop {string} ariaLabel The aria-label of the link.
 * @prop {boolean} disabled The disabled state of the link.
 * @prop {boolean} emphasis Emphasizes the icon (if specified).  This can be used to advertise a default action.
 * @prop {boolean} headerItem Indicates that the link is part of a Header Bar.
 * @prop {string} href The URL of the destination for the link
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {string} iconAppearance Specifies the icon appearance.  Not all icon categories support all or even the same icon appearances.
 * @prop {string} image A data URI representing an image.
 * @prop {boolean} menuOpen Indicates that the icon is associated with a menu that is currently open.
 * @prop {boolean} skipLink Indicates that this link should be styled as a skip link.
 * @prop {string} target Specifies the default target of the `href`.
 * @prop {boolean} toggled The toggled state of the icon (if specified).
 * @prop {string} type The type of link. Use type `light` for dark background.
 * @slot unnamed Defines the display name of the link.
 * @slot prefix Defines the content displayed before the default slot content and has right margin.
 * @slot suffix Defines the content displayed after the default slot content and has left margin.
 */
class OtcLink extends Interactive(ElementBase) {
  #rtlController = new RTLController(this);

  static get styles() {
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
      href: {
        type: String,
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
      skipLink: {
        type: Boolean,
        reflect: true,
      },
      target: {
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

    this.ariaLabel = '';
    this.disabled = false;
    this.emphasis = false;
    this.headerItem = false;
    this.href = '';
    this.icon = '';
    this.iconAppearance = '';
    this.image = '';
    this.menuOpen = false;
    this.skipLink = false;
    this.target = '';
    this.toggled = false;
    this.type = '';
  }

  /**
   * Get the native anchor element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */
  get innerInteractiveElement() {
    return this.shadowRoot ? this.shadowRoot.querySelector('a') : null;
  }

  _getLinkContent() {
    if (shouldRenderIcon(this)) {
      return getSVGForIcon(this.icon, this.image);
    }

    return html``;
  }

  _getTypeSpecificClasses() {
    const classes = {
      'ot-link': true,
      'ot-link--is-light': this.type === 'light',
    };

    if (this.headerItem) {
      classes['ot-btn'] = true;
      classes['ot-btn--is-dark'] = true;
      classes['ot-link--is-light'] = true;
      classes['ot-btn--is-transparent'] = true;
    }
    if (this.skipLink) {
      if (this.#rtlController.isRTL) {
        classes['ot-link--is-skip-link-rtl'] = true;
      } else {
        classes['ot-link--is-skip-link'] = true;
      }
    }
    return { ...classes, ...getClassesForIcon(this) };
  }

  render() {
    const classes = this._getTypeSpecificClasses();

    return html`<a aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}" ?disabled="${this.disabled}" href="${this.href}" target="${this.target.length > 0 ? this.target : nothing}">${this._getLinkContent()}<slot name="prefix"></slot><slot></slot><slot name="suffix"></slot></a>`;
  }
}

if (!customElements.get('otc-link')) {
  customElements.define('otc-link', OtcLink);
}

export { OtcLink };
//# sourceMappingURL=otcLink.js.map
