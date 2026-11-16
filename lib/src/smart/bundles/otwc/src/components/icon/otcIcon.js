/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import { ElementBase } from '../element-base.js';
import { shouldRenderIcon, getSVGForIcon, getClassesForIcon } from '../../utilities/render-utilities.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Icon component is a small graphical element.
 * @prop {string} ariaLabel The `aria-label` associated with an interactive avatar component.
 * @prop {boolean} disabled The disabled state of the icon.
 * @prop {boolean} disableEffects Disables effects such as hover and active when using a smart icon.
 * @prop {boolean} emphasis Emphasizes the icon.<br>This can be used to advertise a default action.
 * @prop {string} icon A string containing the icon bundle and icon name, e.g. action:action_cancel32.
 * @prop {string} iconAppearance Specifies the icon appearance.  Not all icon categories support all or even the same icon appearances.
 * @prop {string} image A data URI representing an image.
 * @prop {boolean} isPresentation Indicates whether this icon is strictly visual and should have the role `presentation`.
 * The default role is `img`.
 * @prop {boolean} menuOpen Indicates that the icon is associated with a menu that is currently open.
 * @prop {boolean} toggled Toggled/On state of the icon.
 */
class OtcIcon extends ElementBase {
  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
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
      disableEffects: {
        type: Boolean,
        reflect: true,
      },
      emphasis: {
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
      isPresentation: {
        type: Boolean,
        reflect: true,
      },
      menuOpen: {
        type: Boolean,
        reflect: true,
      },
      toggled: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.disabled = false;
    this.disableEffects = false;
    this.emphasis = false;
    this.icon = ''; // icon name for icons from icon registry
    this.iconAppearance = '';
    this.image = ''; // optional: set as href in inner image element of svg (if there is one)
    this.isPresentation = false;
    this.menuOpen = false;
    this.toggled = false;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'none');
    }
  }

  #getIconHTML() {
    if (shouldRenderIcon(this)) {
      return getSVGForIcon(this.icon, this.image);
    }
    return html``;
  }

  #getTypeSpecificClasses() {
    return getClassesForIcon(this);
  }

  render() {
    const classes = this.#getTypeSpecificClasses();

    return html`<div aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}" role="${this.isPresentation ? 'presentation' : 'img'}">${this.#getIconHTML()}</div>`;
  }
}

customElements.define('otc-icon', OtcIcon);

export { OtcIcon };
//# sourceMappingURL=otcIcon.js.map
