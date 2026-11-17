/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import { html, nothing } from 'lit';
import commonStyleSheet from '../../styles/common.scss.js';
import iconStyleSheet from '../../styles/icons.scss.js';
import buttonStyleSheet from '../button/otcButton.scss.js';
import linkJatoStyleSheet from './otcLinkJato.scss.js';
import componentStyleSheet from './otcLink.scss.js';
import { ElementBase } from '../element-base.js';
import { Interactive } from '../interactive.js';
import { ThemeController } from '../../controllers/themeController.js';
import { shouldRenderIcon, getSVGForIconWithOptions, getClassesForIcon } from '../../utilities/render-utilities.js';
import { RTLController } from '../../controllers/rtlController.js';
import { classMap as e } from '../../../node_modules/lit-html/directives/class-map.js';

/**
 * The Link component is a clickable text element used for navigation.
 * @prop {string} ariaLabel The aria-label of the link.
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
 * @prop {boolean} disabled Jato only: the disabled state of the button.
 * @prop {string} type The type of link. Use type `light` for dark background.
 * @slot unnamed Defines the display name of the link.
 * @slot prefix Defines the content displayed before the default slot content and has right margin.
 * @slot suffix Defines the content displayed after the default slot content and has left margin.
 */
class OtcLink extends Interactive(ElementBase) {
  #rtlController = new RTLController(this);

  #themeController = new ThemeController(this);

  #iconInSlot;

  #avatarInSlot;

  static get styles() {
    return [
      commonStyleSheet,
      iconStyleSheet,
      buttonStyleSheet,
      linkJatoStyleSheet,
      componentStyleSheet,
    ];
  }

  static get properties() {
    const props = {
      ariaLabel: {
        type: String,
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
      disabled: {
        type: Boolean,
        reflect: true,
      },
      size: {
        type: String,
        reflect: true,
      },
      ignoreVisited: {
        type: Boolean,
        reflect: true,
      },
      lighter: {
        type: Boolean,
        reflect: true,
      },
    };
    return { ...ThemeController.properties, ...props };
  }

  constructor() {
    super();

    this.ariaLabel = '';
    this.href = '';
    this.target = '';
    this.type = 'link';
    this.size = 'small'; // default size of link is small (the size is noticeable when focusing a link)
    this.disabled = false;
    this.ignoreVisited = false;
    this.lighter = false;

    // properties exclusively used to render old (pre jato) links
    this.emphasis = false;
    this.toggled = false;
    this.menuOpen = false;
    this.headerItem = false;
    this.skipLink = false;
    this.icon = '';
    this.iconAppearance = '';
    this.image = '';
  }

  /**
   * Get the native anchor element. This method is used by the interactive interface.
   * @returns {*|null}
   * @internal
   */

  get innerInteractiveElement() {
    return this.#link;
  }

  get #link() {
    if (this.disabled) {
      return this.shadowRoot ? this.shadowRoot.querySelector('span.ot-link-jato') : null;
    }
    return this.shadowRoot ? this.shadowRoot.querySelector('a.ot-link-jato') : null;
  }

  get #slottedNodes() {
    const nodes = this.#link?.querySelector('slot')?.assignedNodes();
    if (nodes) {
      // Remove any all-whitespace text nodes.
      return nodes.filter(node => (node.nodeName !== '#text') || (node.textContent.trim() !== ''));
    }
    return [];
  }

  #isOldLink() {
    return this._themeIsCarbonFiber || this.icon || this.image || this.headerItem || this.iconAppearance
           || this.menuOpen || this.emphasis || this.toggled;
  }

  #isIconOnly() {
    const slottedNodes = this.#slottedNodes;
    return (slottedNodes?.length === 1) && slottedNodes?.at(0)?.matches?.('otc-icon, otc-avatar, img, svg');
  }

  async #adjustIconInSlot() {
    const icon = this.#iconInSlot;

    await icon.updateComplete;

    if (this.#isOldLink()) {
      // If in carbonfiber mode an icon is in the slot, it must be treated as decorative only, because in this case
      // otc-link would draw a smart icon by itself and does not expect one in the slot
      icon.disableEffects = true;
      return;
    }

    switch (this.type) {
      case 'skiplink':
      case 'subtle':
      case 'status':
        icon.setAttribute('type', this.type);
        break;
      default:
        icon.setAttribute('type', 'link');
    }

    icon.setAttribute('isPresentation', ''); // image inside link is always for presentation only

    if (icon.nodeName === 'OTC-ICON') {
      // Set size only if icon node is otc-icon. Don't set it for example if it is otc-avatar.
      if (!icon.getAttribute('size')) {
        icon.setAttribute('size', 16);
      }
    }

    const flags = ['disabled', 'toggled', 'emphasis', 'menuOpen'];
    for (const flag of flags) {
      if (this[flag]) {
        icon.setAttribute(flag, '');
      } else {
        icon.removeAttribute(flag);
      }
    }
  }

  async #adjustAvatarInSlot() {
    const avatar = this.#avatarInSlot;

    await avatar.updateComplete;

    const flags = ['disabled', 'toggled', 'emphasis', 'menuOpen'];
    for (const flag of flags) {
      if (this[flag]) {
        avatar.setAttribute(flag, '');
      } else {
        avatar.removeAttribute(flag);
      }
    }

    // set size on icon only if no size is explicitly set at the otc-avatar
    if (!avatar.getAttribute('size')) {
      let avatarSize;
      switch (this.size) {
        case 'small':
          avatarSize = 24;
          break;
        case 'large':
          avatarSize = 40;
          break;
        default:
          avatarSize = 32;
      }
      avatar.setAttribute('size', avatarSize);
    }
  }

  async #handleSlotChange() {
    const slottedNodes = this.#slottedNodes;

    let haveOtcIcon = false;
    let haveOtcAvatar = false;
    for (const node of slottedNodes) {
      if (!haveOtcIcon) {
        if (node.nodeName === 'OTC-ICON') {
          haveOtcIcon = true;
          this.#iconInSlot = node;
          // eslint-disable-next-line no-await-in-loop
          await this.#adjustIconInSlot();
          return;
        }
      }
      if (!haveOtcAvatar) {
        if (node.nodeName === 'OTC-AVATAR') {
          haveOtcAvatar = true;
          this.#avatarInSlot = node;
          // eslint-disable-next-line no-await-in-loop
          await this.#adjustAvatarInSlot();
        }
      }
    }
    if (!haveOtcIcon) {
      this.#iconInSlot = undefined;
    }
    if (!haveOtcAvatar) {
      this.#avatarInSlot = undefined;
    }
  }

  #getTypeSpecificClasses() {
    const isSkipLink = this.type === 'skiplink' || this.skipLink;
    const isLink = this.type === '' || this.type === 'link';
    return {
      'ot-link-jato': true,
      'ot-link-jato--is-link': isLink,
      'ot-link-jato--is-subtle': this.type === 'subtle' || this.type === 'status',
      'ot-link-jato--is-skiplink': isSkipLink,
      'ot-link-jato--is-avatar': this.type === 'avatar',
      'ot-link-jato--is-icon-only': this.#isIconOnly(),
      'ot-link-jato--is-small': !isSkipLink && (this.size === 'small' || this.size === '' || this.type === 'status'),
      'ot-link-jato--is-large': !(isSkipLink || this.type === 'status') && this.size === 'large',
      'ot-link-jato--is-lighter': this.lighter,
      'ot-link-jato--handle-visited': !(this.ignoreVisited || this.type === 'status'),
      'ot-link-jato--is-rtl': this.#rtlController.isRTL,
    };
  }

  updated() {
    if (this.#iconInSlot) {
      this.#adjustIconInSlot();
    }
  }

  #getLinkContent() {
    if (shouldRenderIcon(this)) {
      return getSVGForIconWithOptions({ iconKey: this.icon, image: this.image }, { role: 'presentation' });
    }

    return html``;
  }

  #getTypeSpecificClassesOld() {
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
    let classes;
    if (this.#isOldLink()) {
      // carbonfiber theme
      classes = this.#getTypeSpecificClassesOld();
      return html`<a aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}" href="${this.href}" target="${this.target.length > 0 ? this.target : nothing}">${this.#getLinkContent()}<slot name="prefix"></slot><slot></slot><slot name="suffix"></slot></a>`;
    }
    // jato theme
    classes = this.#getTypeSpecificClasses();
    if (this.disabled) {
      return html`<span aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}">${this.#getLinkContent()}<slot @slotchange="${this.#handleSlotChange}"></slot></span>`;
    }
    return html`<a aria-label="${this.ariaLabel.length > 0 ? this.ariaLabel : nothing}" class="${e(classes)}" href="${this.href}" target="${this.target.length > 0 ? this.target : nothing}">${this.#getLinkContent()}<slot @slotchange="${this.#handleSlotChange}"></slot></a>`;
  }
}

if (!customElements.get('otc-link')) {
  customElements.define('otc-link', OtcLink);
}

export { OtcLink };
//# sourceMappingURL=otcLink.js.map
