/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { LitElement, html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import componentStyleSheet from './otcAvatar.scss.js';
import { ElementBase } from '../element-base.js';
import { ThemeController } from '../../controllers/themeController.js';
import defaultImage from './default.image.js';
import { createRef as e, ref as n } from '../../../node_modules/lit-html/directives/ref.js';
import { classMap as e$1 } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Avatar component is a round element that displays either an image, an icon from one of the icon bundles, or user initials.
 * @prop {string} ariaLabel The `aria-label` associated with an interactive avatar component. This should include the initials, if shown.
 * <br>**DEPRECATED: ** used only in carbonfiber mode together with interactive because a decorative image does not need an aria-label.
 * @prop {string} iconAppearance Specifies the icon appearance of the avatar component.<br>**DEPRECATED: ** used only in carbonfiber mode.
 * @prop {string} image The URL of an image. Can be a relative, absolute URL or a data URI representing the image.
 * @prop {string} initials A string containing the user initials. The first two characters in capital letters are used for display.
 * @prop {boolean} interactive Determines if this avatar should be interactive like a button, including the addition of hover/focus effects.
 * <br>**DEPRECATED: ** used only in carbonfiber mode. Wrap the avatar with an interactive element like otc-button or otc-link.
 * @prop {string} size The size of the avatar. The given value will be set as width and height of the image or svg.<br>If no value is
 * provided, the default is 100% and the width and height of otc-avatar or the parent element will define the avatar size.
 */
class OtcAvatar extends ElementBase {
  #themeController = new ThemeController(this);

  #imageRef = e();

  #sizeWithUnit = '';

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
      componentStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: {
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
      initials: {
        type: String,
        reflect: true,
      },
      interactive: {
        type: Boolean,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
    };
    return { ...ThemeController.properties, ...props };
  }

  // todo: Remove once CF support is removed, because only in CF we have the interactive mode where focus makes sense.
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
    this.image = '';
    this.initials = '';
    this.interactive = false;
    this.size = ''; // if not set, width and height will be 100%
  }

  #getSizeWithUnit() {
    let size = this.size ? this.size : '100%';
    const lastChar = size.charAt(size.length - 1);
    if (Number.isFinite(+lastChar)) { // is last char numeric?
      size += 'px'; // only add px if size not already has a unit
    }
    return size;
  }

  async updated(changedProperties) {
    super.updated(changedProperties);

    await this.updateComplete;

    if (this.size) {
      const sizeWithUnit = this.#getSizeWithUnit();
      this.style.width = sizeWithUnit;
      this.style.height = sizeWithUnit;
    }
    if (this.#imageRef.value) {
      const cs = window.getComputedStyle(this);
      const allZeroBorderRadius = cs['border-top-left-radius'] === '0px'
        && cs['border-top-right-radius'] === '0px'
        && cs['border-bottom-left-radius'] === '0px'
        && cs['border-bottom-right-radius'] === '0px';
      if (allZeroBorderRadius && !this.style.borderRadius) {
        this.#imageRef.value.style.borderRadius = '50%';
      }
    }
  }

  // the actual colors are codified in otcss classes
  #getLetterAvatarColorClassCF(initials) {
    if (!initials) {
      return '';
    }

    let charIndex = 0; const initialsLen = initials.length;
    for (let i = 0; i < initialsLen; i += 1) {
      charIndex += initials.charCodeAt(i);
    }
    return `ot-avatar--bg-${charIndex % 16}`;
  }

  #getSVGWrappedWithInitialsCF() {
    const initials = this.initials.substring(0, 2).toUpperCase();

    return html`<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="${this.#sizeWithUnit}" height="${this.#sizeWithUnit}" role="presentation" viewBox="0 0 42 42" class="ot-svg ot-svg--header ${this.#getLetterAvatarColorClassCF(initials)}"><defs><clipPath id="circleView"><circle cx="50%" cy="50%" r="50%" fill="#FFFFFF"/></clipPath></defs><style>.text{font-size:18px;fill:#fff}</style><circle class="bg" stroke="none" cx="21" cy="21" r="20"/><text class="text" x="50%" y="50%" text-anchor="middle" dy=".35em" clip-path="url(#circleView)">${initials}</text><circle class="ot-top-state" fill="none" stroke="none" cx="21" cy="21" r="20.0"/><circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5"/></svg>`;
  }

  #getImageClassesCF() {
    const avatarClassList = this.classList;
    return {
      'ot-avatar-img': true,
      'ot-select-user-item-img': avatarClassList.contains('ot-select-user-item__svg'),
      'ot-select-user-item-img-extensible': avatarClassList.contains('ot-select-user-item__svg-extensible'),
    };
  }

  #getIconTemplateCF() {
    let { image } = this;
    if (!this.image && !this.initials) {
      // use the default user avatar icon in case no icon, image or initials are specified
      image = defaultImage;
    }
    if (image) {
      return html`<img alt="" width="${this.#sizeWithUnit}" height="${this.#sizeWithUnit}" class="${e$1(this.#getImageClassesCF())}" src="${image}" role="presentation">`;
    }
    return this.#getSVGWrappedWithInitialsCF();
  }

  #getClassesCF() {
    const classes = {
      'ot-btn': true,
      'ot--is-header-item': true,
      'ot-icon': true,
      'ot-icon--is-header-icon-user': true,
      'ot-icon--is-styleable-icon': !this.image,
      'ot-avatar--img-container': this.image,
    };
    if (this.iconAppearance) {
      classes[`ot-icon--appearance-${this.iconAppearance}`] = true;
    }
    return classes;
  }

  #getInteractiveTemplateCF() {
    return html`<button aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e$1(this.#getClassesCF())}" width="${this.#sizeWithUnit}" height="${this.#sizeWithUnit}" id="avatar-button">${this.#getIconTemplateCF()}</button>`;
  }

  // JATO starts here

  #getImageTemplate() {
    let { image } = this;
    if (!image) {
      image = defaultImage;
    }
    const classes = {
      'ot-avatar-jato--image': true,
    };

    return html`<div class="ot-avatar-jato" style="width:${this.#sizeWithUnit};height:${this.#sizeWithUnit}"><img alt="" ${n(this.#imageRef)} width="${this.#sizeWithUnit}" height="${this.#sizeWithUnit}" class="${e$1(classes)}" src="${image}" role="presentation"></div>`;
  }

  #getInitialsTemplate() {
    const initials = this.initials.substring(0, 2).toUpperCase();
    let charIndex = 0;
    for (let i = 0; i < initials.length; i += 1) {
      charIndex += initials.charCodeAt(i);
    }
    const classes = {
      'ot-avatar-jato--initials': true,
    };
    classes[`ot-avatar-jato--is-bg-${charIndex % 7}`] = true;
    return html`<div class="ot-avatar-jato" style="width:${this.#sizeWithUnit};height:${this.#sizeWithUnit}"><div ${n(this.#imageRef)} class="${e$1(classes)}">${initials}</div></div>`;
  }

  render() {
    this.#sizeWithUnit = this.#getSizeWithUnit();

    if (this._themeIsCarbonFiber) {
      return html`${this.interactive ? this.#getInteractiveTemplateCF() : this.#getIconTemplateCF()}`;
    }
    // JATO starts here:
    if (!this.image && this.initials && (typeof this.initials === 'string' || this.initials instanceof String)) {
      return this.#getInitialsTemplate();
    }
    return this.#getImageTemplate();
  }
}

if (!customElements.get('otc-avatar')) {
  customElements.define('otc-avatar', OtcAvatar);
}

export { OtcAvatar };
//# sourceMappingURL=otcAvatar.js.map
